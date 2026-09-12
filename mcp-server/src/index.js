#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { config } from './config.js';
import { allTools } from './tools/index.js';
import { allResources } from './resources/index.js';
import { allPrompts } from './prompts/index.js';

// Parse CLI Arguments
const args = process.argv.slice(2);
let transportMode = config.transport;
let port = config.port;

args.forEach(arg => {
  if (arg.startsWith('--transport=')) {
    transportMode = arg.split('=')[1].toLowerCase();
  } else if (arg.startsWith('--port=')) {
    port = parseInt(arg.split('=')[1], 10);
  }
});

function createMcpServer() {
  const server = new Server(
    {
      name: config.serverName,
      version: config.serverVersion
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    }
  );

  // 1. Tool Handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: toolArgs = {} } = request.params;
    const tool = allTools.find(t => t.name === name);

    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: Tool "${name}" is not registered on Nunnarri MCP Server.`
          }
        ]
      };
    }

    try {
      const result = await tool.handler(toolArgs);
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Tool Execution Error [${name}]: ${err.message}`
          }
        ]
      };
    }
  });

  // 2. Resource Handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: allResources.map(r => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType
      }))
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const resource = allResources.find(r => r.uri === uri);

    if (!resource) {
      throw new Error(`Resource "${uri}" not found on Nunnarri MCP Server.`);
    }

    const text = await resource.handler();
    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text
        }
      ]
    };
  });

  // 3. Prompt Handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: allPrompts.map(p => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments
      }))
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: promptArgs = {} } = request.params;
    const prompt = allPrompts.find(p => p.name === name);

    if (!prompt) {
      throw new Error(`Prompt template "${name}" not found.`);
    }

    return await prompt.handler(promptArgs);
  });

  return server;
}

// Start Server based on Transport Mode
async function main() {
  if (transportMode === 'sse' || transportMode === 'http') {
    const app = express();
    app.use(cors());
    app.use(express.json());

    let sseTransport = null;

    app.get('/sse', async (req, res) => {
      console.error(`[MCP SSE] Client connected to SSE endpoint`);
      sseTransport = new SSEServerTransport('/message', res);
      const server = createMcpServer();
      await server.connect(sseTransport);
    });

    app.post('/message', async (req, res) => {
      if (sseTransport) {
        await sseTransport.handlePostMessage(req, res);
      } else {
        res.status(400).json({ error: 'No active SSE connection.' });
      }
    });

    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        server: config.serverName,
        version: config.serverVersion,
        toolsCount: allTools.length,
        resourcesCount: allResources.length,
        promptsCount: allPrompts.length
      });
    });

    app.listen(port, () => {
      console.error(`⚡ Nunnarri MCP Server (SSE/HTTP) listening on http://localhost:${port}`);
      console.error(`   - SSE Endpoint: http://localhost:${port}/sse`);
      console.error(`   - Message Endpoint: http://localhost:${port}/message`);
      console.error(`   - Health Check: http://localhost:${port}/health`);
    });
  } else {
    // Default: Stdio Transport (For Antigravity, Claude Desktop, Cursor, etc.)
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`⚡ Nunnarri MCP Server running on stdio (${allTools.length} tools, ${allResources.length} resources, ${allPrompts.length} prompts)`);
  }
}

main().catch(err => {
  console.error('Fatal MCP Server Error:', err);
  process.exit(1);
});
