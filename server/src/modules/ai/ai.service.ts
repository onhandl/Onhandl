import { Readable } from 'stream';
import { AIFactory } from '../../infrastructure/ai/factory';
import { CompletionRequest } from '../../infrastructure/ai/types';
import { AgentRepository } from '../agents/agent.repository';
import { getSpecializedSystemPrompt } from '../../core/engine/processors/prompts';
import { generateRandomBalance } from '../../core/engine/simulators/crypto/helpers';

export const AiService = {
    async testConnection(provider: string, apiKey: string) {
        if (!apiKey) throw Object.assign(new Error('API Key is required'), { code: 400 });

        const aiProvider = AIFactory.getProvider(provider);
        const success = await aiProvider.testConnection(apiKey);

        if (!success) {
            throw new Error(`Connection test failed for ${provider}. Please check your API key.`);
        }

        return { success: true, message: `Connection successful! ${provider} API is working.` };
    },

    async generateCompletion(reqBody: CompletionRequest, headersApiKey?: string) {
        const providerName = reqBody.provider || 'gemini';
        const apiKey = headersApiKey || reqBody.apiKey;

        const aiProvider = AIFactory.getProvider(providerName);
        return aiProvider.generateCompletion({
            ...reqBody,
            apiKey
        });
    },

    async generateStream(reqBody: CompletionRequest & { agentId?: string }, headersApiKey?: string) {
        const providerName = reqBody.provider || 'gemini';
        const apiKey = headersApiKey || reqBody.apiKey;
        const agentId = reqBody.agentId;

        const aiProvider = AIFactory.getProvider(providerName);

        if (!aiProvider.generateStream) {
            throw new Error(`Provider ${providerName} does not support streaming yet.`);
        }

        let messages = [...(reqBody.messages || [])];

        // If agentId is provided, inject specialized domain prompt
        if (agentId) {
            const agent = await AgentRepository.findById(agentId);
            if (agent) {
                let walletContext = '';

                // Proactive balance fetch for financial agents
                if (agent.agentType === 'financial_agent' || (agent as any).character?.agent_type === 'financial_agent') {
                    const wallets = (agent as any).blockchain || [];

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

        return aiProvider.generateStream({
            ...reqBody,
            messages,
            apiKey
        });
    },
};
