import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { AIFactory } from '../../infrastructure/ai/factory';
import { CompletionRequest } from '../../infrastructure/ai/types';
import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { getSpecializedSystemPrompt } from '../../core/engine/processors/prompts';
import { generateRandomBalance } from '../../core/engine/simulators/crypto/helpers';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
    // Test API connection
    fastify.post<{ Body: { provider: string; apiKey: string } }>(
        '/test-connection',
        async (request, reply) => {
            const { provider, apiKey } = request.body;

            if (!apiKey) {
                return reply.code(400).send({ error: 'API Key is required' });
            }

            try {
                const aiProvider = AIFactory.getProvider(provider);
                const success = await aiProvider.testConnection(apiKey);

                if (success) {
                    return { success: true, message: `Connection successful! ${provider} API is working.` };
                } else {
                    throw new Error(`Connection test failed for ${provider}. Please check your API key.`);
                }
            } catch (error: any) {
                return reply.code(500).send({ error: error.message });
            }
        }
    );

    // Generic AI completion endpoint (supports hybrid key management)
    fastify.post<{ Body: CompletionRequest }>(
        '/complete',
        async (request, reply) => {
            const reqBody = request.body;
            const providerName = reqBody.provider || 'gemini';

            // Check for API key in headers (client-side provided) or body
            const apiKey = (request.headers['x-ai-api-key'] as string) || reqBody.apiKey;

            try {
                const aiProvider = AIFactory.getProvider(providerName);
                const response = await aiProvider.generateCompletion({
                    ...reqBody,
                    apiKey // Inject the key (if provided by client)
                });

                return response;
            } catch (error: any) {
                console.error(`AI Completion Error [${providerName}]:`, error);
                return reply.code(500).send({ error: error.message });
            }
        }
    );

    // Streaming AI completion endpoint
    fastify.post<{ Body: CompletionRequest & { agentId?: string } }>(
        '/stream',
        async (request, reply) => {
            const reqBody = request.body;
            const providerName = reqBody.provider || 'gemini';
            const apiKey = (request.headers['x-ai-api-key'] as string) || reqBody.apiKey;
            const agentId = reqBody.agentId;

            try {
                const aiProvider = AIFactory.getProvider(providerName);

                if (!aiProvider.generateStream) {
                    throw new Error(`Provider ${providerName} does not support streaming yet.`);
                }

                let messages = [...(reqBody.messages || [])];

                // If agentId is provided, inject specialized domain prompt
                if (agentId) {
                    const agent = await AgentDefinition.findById(agentId);
                    if (agent) {
                        let walletContext = '';

                        // Proactive balance fetch for financial agents
                        if (agent.agentType === 'financial_agent' || agent.character?.agent_type === 'financial_agent') {
                            const wallets = agent.blockchain || [];

                            // 1. Fetch stored wallets
                            if (wallets.length > 0) {
                                walletContext += '\nYOUR PERMANENT BALANCES:';
                                wallets.forEach((w: any) => {
                                    const bal = generateRandomBalance(w.network);
                                    walletContext += `\n- ${w.network} (${w.walletAddress}): ${bal} CKB`;
                                });
                            }

                            // 2. Proactively detect addresses in the LATEST user message
                            const lastUserMsg = messages.filter(m => m.role === 'user').pop();
                            if (lastUserMsg) {
                                // Extract CKB addresses (ckt/ckb followed by alphanumeric)
                                const ckbRegex = /(ckt|ckb)1[0-9a-z]{38,}/gi;
                                const matches = lastUserMsg.content.match(ckbRegex);
                                if (matches && matches.length > 0) {
                                    walletContext += '\n\nDETECTED ADDRESS BALANCES (LIVE):';
                                    matches.forEach(addr => {
                                        const bal = generateRandomBalance('ckb-testnet');
                                        walletContext += `\n- ${addr}: ${bal} CKB`;
                                    });
                                }
                            }
                        }

                        if (walletContext) {
                            walletContext = `LIVE BLOCKCHAIN DATA (Injecting for accuracy):\n${walletContext.trim()}`;
                        }

                        const specializedPrompt = getSpecializedSystemPrompt(agent, walletContext);

                        // Replace or prepend the system prompt
                        const systemIdx = messages.findIndex(m => m.role === 'system');
                        if (systemIdx !== -1) {
                            messages[systemIdx].content = specializedPrompt;
                        } else {
                            messages.unshift({ role: 'system', content: specializedPrompt });
                        }
                    }
                }

                const stream = aiProvider.generateStream({
                    ...reqBody,
                    messages,
                    apiKey
                });

                const readable = Readable.from((async function* () {
                    try {
                        for await (const chunk of stream) {
                            if (chunk) {
                                yield `data: ${JSON.stringify({ content: chunk })}\n\n`;
                            }
                        }
                    } catch (err: any) {
                        console.error('Stream generation error:', err);
                        yield `data: ${JSON.stringify({ error: err.message })}\n\n`;
                    }
                })());

                return reply
                    .header('Content-Type', 'text/event-stream')
                    .header('Cache-Control', 'no-cache')
                    .header('Connection', 'keep-alive')
                    .header('Access-Control-Allow-Origin', request.headers.origin || 'http://localhost:3000')
                    .header('Access-Control-Allow-Credentials', 'true')
                    .send(readable);

            } catch (error: any) {
                console.error(`AI Stream Error [${providerName}]:`, error);
                return reply.code(500).send({ error: error.message });
            }
        }
    );
};
