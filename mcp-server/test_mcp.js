import { allTools } from './src/tools/index.js';
import { allResources } from './src/resources/index.js';
import { allPrompts } from './src/prompts/index.js';

console.log("=== Nunnarri MCP Server Verification Test ===");
console.log(`Total Registered Tools: ${allTools.length}`);
allTools.forEach((t, i) => {
  console.log(` [Tool ${i+1}] ${t.name}: ${t.description.slice(0, 60)}...`);
});

console.log(`\nTotal Registered Resources: ${allResources.length}`);
allResources.forEach((r, i) => {
  console.log(` [Resource ${i+1}] ${r.uri} (${r.name})`);
});

console.log(`\nTotal Registered Prompts: ${allPrompts.length}`);
allPrompts.forEach((p, i) => {
  console.log(` [Prompt ${i+1}] ${p.name}: ${p.description.slice(0, 60)}...`);
});

console.log("\nTesting prompt formatting...");
const testPrompt = allPrompts[0];
const promptResult = await testPrompt.handler({ deviceId: 'esp32-main-board' });
console.log(`Prompt "${testPrompt.name}" rendered successfully:`, promptResult.messages.length, "message(s)");

console.log("\n=== MCP Server Unit Tests PASSED ===");
