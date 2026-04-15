import * as fs from 'fs';

const fullText = fs.readFileSync('/tmp/agents.ts', 'utf8');

const imports = `import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { AgentNode } from '../../infrastructure/database/models/AgentNode';
import { AgentEdge } from '../../infrastructure/database/models/AgentEdge';
import { Workspace } from '../../infrastructure/database/models/Workspace';
import { User } from '../../infrastructure/database/models/User';
import { Purchase } from '../../infrastructure/database/models/Purchase';
import { PLANS, PlanId } from '../../shared/constants/tokens';
import { verifyAuthCookie } from '../../api/middlewares/auth';
import { AgentEnhancer } from './agent-enhancer.service';
import { validateCharacter } from '../../core/characters/validator';
import { WalletService } from '../../infrastructure/blockchain/wallet.service';
import { ENV } from '../../shared/config/environments';
import { Orchestrator } from '../../core/engine/orchestrator';
import { Readable } from 'stream';
`;

// get bodies
function getBody(text, name) {
    const startStr = \`export const \${name}: FastifyPluginAsync = async (fastify) => {\`;
    let startIdx = text.indexOf(startStr);
    if (startIdx === -1) return '';
    startIdx += startStr.length;
    // Walk forward to find the matching '}' at the end
    let braces = 1;
    let endIdx = startIdx;
    while (braces > 0 && endIdx < text.length) {
        if (text[endIdx] === '{') braces++;
        if (text[endIdx] === '}') braces--;
        endIdx++;
    }
    // endIdx is just after the closing '}'
    return text.substring(startIdx, endIdx - 1);
}

const readBody = getBody(fullText, 'readAgentRoutes');
const createBody = getBody(fullText, 'createAgentRoutes');
const updateBody = getBody(fullText, 'updateAgentRoutes');

// Extract helpers
const helpersRegex = /function\s+fmtDate[\s\S]*?(?=export const readAgentRoutes)/;
const readHelpers = fullText.match(helpersRegex)?.[0] || '';

const createHelpersRegex = /async function\s+saveGraphData[\s\S]*?(?=export const createAgentRoutes)/;
const createHelpers = fullText.match(createHelpersRegex)?.[0] || '';

const updateHelpersRegex = /async function\s+syncGraph[\s\S]*?(?=export const updateAgentRoutes)/;
const updateHelpers = fullText.match(updateHelpersRegex)?.[0] || '';

const combined = \`\${imports}
\${readHelpers}
\${createHelpers}
\${updateHelpers}

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
    // ==== READ ROUTES ====
    \${readBody}

    // ==== CREATE ROUTES ====
    \${createBody}

    // ==== UPDATE ROUTES ====
    \${updateBody}
};
\`;

fs.writeFileSync('src/modules/agents/agent.controller.ts', combined);
console.log('Successfully fixed agent.controller.ts');
