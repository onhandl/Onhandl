import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AgentDefinition } from '../../../infrastructure/database/models/AgentDefinition';
import { Orchestrator } from '../../../core/engine/orchestrator';

const MCP_PROTOCOL_VERSION = '2025-03-26';

export async function mcpController(fastify: FastifyPluginAsync extends (f: infer F, ...a: any[]) => any ? F : never) {
    // re-export handled by index.ts
}

export { mcpRoutes } from './mcp.controller';
