import dotenv from 'dotenv';
dotenv.config();

export const config = {
  userDatabaseUrl: process.env.USER_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:prabha0312@localhost:5432/user_db',
  iotDatabaseUrl: process.env.IOT_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:prabha0312@localhost:5432/nexus_iot_db',
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:5002',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  port: parseInt(process.env.PORT || process.env.MCP_PORT || '5007', 10),
  transport: process.env.MCP_TRANSPORT || 'stdio',
  serverName: 'nunnarri-mcp-server',
  serverVersion: '1.0.0'
};

export default config;
