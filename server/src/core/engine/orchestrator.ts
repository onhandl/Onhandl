import { AgentDefinition } from '../../infrastructure/database/models/AgentDefinition';
import { MemoryService } from './memory';
import { AIFactory } from '../../infrastructure/ai/factory';
import { AgentNode } from '../../infrastructure/database/models/AgentNode';
import { getCapacities, formatCKB } from '../../infrastructure/blockchain/ckb/balance';
import {
    parseWalletIntent,
    handleWalletIntent,
    WalletContext
} from './sub-orchestrators/WalletSubOrchestrator';

/**
 * The Routing/Orchestrator Agent
 * Parses intent and routes to specific sub-orchestrators or LLM dynamically.
 */
export class Orchestrator {

    /** Helper to handle SSE or raw chunk streaming to Fastify reply */
    private static sendEvent(res: unknown, data: string) {
        if (!res) return;
        const out = res as any;
        if (typeof out.push === 'function') out.push(data);
        else if (typeof out.write === 'function') out.write(data);
    }

    /**
     * Entry point for unified /api/agent/query
     */
    static async handleQuery(
        prompt: string,
        agentId: string,
        userId: string,
        sessionId: string,
        res?: any // optional response object for streaming
    ) {
        const agent = await AgentDefinition.findById(agentId);
        if (!agent) throw new Error("Agent not found");

        await MemoryService.getSession(sessionId, agentId, userId);
        await MemoryService.addMessage(sessionId, 'user', prompt);

        const providerName = agent.modelProvider || 'ollama';
        const aiProvider = AIFactory.getProvider(providerName);
        const aiParams = {
            provider: providerName as any,
            model: agent.modelConfig?.modelName || 'qwen2.5:3b',
            apiKey: undefined as any
        };

        // ── 1. Detect visual graph node types (tools connected in canvas) ──────
        const nodes = await AgentNode.find({ agentId });
        const hasCryptoTool = nodes.some((n: any) =>
            n.type === 'crypto_wallet' || n.type === 'blockchain_tool' || n.type === 'crypto_trade'
        );
        const hasSocialTool = nodes.some((n: any) => n.type === 'telegram' || n.type === 'whatsapp');
        let effectiveAgentType: string = agent.agentType || 'operational_agent';
        if (hasCryptoTool) effectiveAgentType = 'financial_agent';
        else if (hasSocialTool) effectiveAgentType = 'social_agent';

        // ── 2. Build agent wallet context (always, for any financial agent) ────
        const agentWallets: WalletContext[] = (agent.blockchain || []) as WalletContext[];
        const isFinancial = effectiveAgentType === 'financial_agent'
            || agent.character?.agent_type === 'financial_agent';

        // ── 3. Intent Router: check if we can handle this without LLM ──────────
        if (isFinancial) {
            const parsed = parseWalletIntent(prompt);

            // Check if user is approving a pending transfer (fuzzy match to handle typos)
            const lowerPrompt = prompt.toLowerCase().replace(/\s+/g, ' ').trim();
            const isApproval =
                lowerPrompt.includes('i approve') ||
                lowerPrompt.includes('approve this transaction') ||
                lowerPrompt.includes('yes, send') ||
                lowerPrompt.includes('confirm transfer') ||
                lowerPrompt.includes('proceed');

            // If approval, override intent to 'transfer' so the handler runs the transfer
            if (isApproval) {
                const result = await handleWalletIntent(
                    { intent: 'transfer' },  // Force transfer intent for approval flow
                    agentWallets,
                    true,
                    sessionId
                );

                if (result.message) {
                    await MemoryService.addMessage(sessionId, 'assistant', result.message);
                    const words = result.message.split(' ');
                    for (const word of words) {
                        this.sendEvent(res, `data: ${JSON.stringify({ content: word + ' ' })}\n\n`);
                        await new Promise(r => setTimeout(r, 12));
                    }
                    return;
                }
                // If no message (no pending transfer found), fall through to LLM
            } else if (parsed.intent !== 'unknown') {
                const result = await handleWalletIntent(parsed, agentWallets, false, sessionId);

                // Save to memory
                await MemoryService.addMessage(sessionId, 'assistant', result.message);

                // Stream word-by-word for a natural feel
                const words = result.message.split(' ');
                for (const word of words) {
                    this.sendEvent(res, `data: ${JSON.stringify({ content: word + ' ' })}\n\n`);
                    await new Promise(r => setTimeout(r, 12));
                }

                if (result.requiresApproval) {
                    this.sendEvent(res, `data: ${JSON.stringify({ type: 'control', status: 'approval_required' })}\n\n`);
                }
                return;
            }
        }

        // ── 4. Fallback: LLM with enriched context ─────────────────────────────
        // Build wallet context string for the prompt
        let walletContextLines: string[] = [];
        if (isFinancial && agentWallets.length > 0) {
            walletContextLines.push('AGENT WALLETS (use these when the user asks for your balance or address):');
            for (const w of agentWallets) {
                if (!w.walletAddress) continue;
                try {
                    const caps = await getCapacities(w.walletAddress);
                    const bal = formatCKB(caps);
                    walletContextLines.push(`- Network: ${w.network || 'CKB Testnet'} | Address: ${w.walletAddress} | Balance: ${bal} CKB`);
                } catch {
                    walletContextLines.push(`- Network: ${w.network || 'CKB Testnet'} | Address: ${w.walletAddress} | Balance: (lookup failed)`);
                }
            }
        }

        const agentPersona = agent.persona ||
            agent.character?.identity?.description ||
            `You are ${agent.name}, a helpful AI assistant.`;

        const systemContent = [
            `You are ${agent.name}. ${agentPersona}`,
            '',
            'RULES:',
            '- Respond in plain conversational language. Do NOT output raw JSON.',
            '- If asked for your wallet address or balance, use the AGENT WALLETS section below.',
            '- For fund transfers, you must ask for user confirmation first.',
            '',
            ...(walletContextLines.length > 0 ? walletContextLines : [])
        ].join('\n');

        const chatHistory = await MemoryService.getRecentMessages(sessionId);
        const completionMessages: any[] = [
            { role: 'system', content: systemContent },
            ...chatHistory.map((m: any) => ({ role: m.role, content: m.content }))
        ];

        const sendEvent = (data: string) => {
            if (!res) return;
            if (typeof res.push === 'function') res.push(data);
            else if (typeof res.write === 'function') res.write(data);
        };

        try {
            console.log(`[Orchestrator] Delegating to ${providerName} (${agent.name})`);
            const startTime = Date.now();

            if (res && aiProvider.generateStream) {
                const stream = aiProvider.generateStream({
                    ...aiParams,
                    messages: completionMessages
                });
                let fullResponse = '';
                for await (const chunk of stream) {
                    fullResponse += chunk;
                    this.sendEvent(res, `data: ${JSON.stringify({ content: chunk })}\n\n`);
                }
                await MemoryService.addMessage(sessionId, 'assistant', fullResponse);
                console.log(`[Orchestrator] Stream closed in ${Date.now() - startTime}ms`);
            } else {
                const result = await aiProvider.generateCompletion({
                    ...aiParams,
                    messages: completionMessages
                });
                await MemoryService.addMessage(sessionId, 'assistant', result.content);
                return result;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[Orchestrator] Error:', msg);
            throw new Error(`Orchestration Failed: ${msg}`);
        }
    }
}
