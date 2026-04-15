import { AgentRepository } from '../agent.repository';
import { AgentTemplateService } from '../agent-template.service';
import { enhancePersona } from '../agent-enhancer.service';
import { validateCharacter } from '../../../core/characters/validator';
import { WalletService } from '../../../infrastructure/blockchain/wallet.service';
import { Workspace } from '../../../infrastructure/database/models/Workspace';
import { User } from '../../../infrastructure/database/models/User';
import { resolveProviderKeys } from '../../../shared/utils/provider-utils';
import { getUserPlan, assertAgentLimit, assertTemplateAccess } from '../../../shared/utils/plan-enforcement';

export interface CreateAgentParams {
    userId: string;
    name: string;
    description?: string;
    persona?: string;
    graph?: any;
    identities?: any;
    character?: any;
    isDraft?: boolean;
    agentType?: string;
    chains?: string[];
    log: (msg: string) => void;
}

export const AgentCreationService = {
    async createAgent(params: CreateAgentParams) {
        const { userId, name, description, persona, graph, identities, character,
            isDraft, agentType = 'operational_agent', chains, log } = params;

        const [workspace, user, planId] = await Promise.all([
            Workspace.findOne({ ownerId: userId }),
            User.findById(userId).select('apiKeys').lean(),
            getUserPlan(userId),
        ]);
        if (!workspace) throw { code: 404, message: 'No workspace found' };

        // ── Plan enforcement: agent limit ─────────────────────────────────────
        const currentCount = await AgentRepository.count({ workspaceId: workspace._id });
        assertAgentLimit(planId, currentCount);

        const { provider, apiKey, model } = resolveProviderKeys((user as any)?.apiKeys);

        let finalCharacter = character || {};
        if (persona && (!finalCharacter.character?.bio || Object.keys(finalCharacter).length <= 1)) {
            const enhanced = await enhancePersona(name, persona, provider, apiKey, model, agentType, chains);
            if (!enhanced.character || !enhanced.identity) throw new Error('AI generated an incomplete character. Please try a more detailed persona summary.');
            finalCharacter = enhanced;
        }

        const validationResult = validateCharacter(agentType, finalCharacter);
        if (!validationResult.isValid) throw { code: 400, message: 'Character Schema Validation Failed', details: validationResult.errors };

        const agentData: Record<string, unknown> = {
            ownerId: userId, workspaceId: workspace._id, name, persona,
            description: description || finalCharacter.identity?.description || finalCharacter.character?.bio || '',
            identities: identities || {}, character: finalCharacter,
            agentType, modelProvider: provider, modelConfig: { modelName: model || 'qwen2.5:3b' },
            isDraft: isDraft ?? true,
        };

        if (chains && chains.length > 0) {
            const wallets: any[] = [];
            for (const chain of chains) {
                try { wallets.push(await WalletService.generateWallet(chain) as any); } catch { log(`wallet gen failed for ${chain}`); }
            }
            if (wallets.length > 0) agentData.blockchain = wallets;
        }

        const agent = await AgentRepository.create(agentData);
        await User.findByIdAndUpdate(userId, { $inc: { tokens: -300 } });

        const fallbackNode = {
            agentId: agent._id, nodeId: `character-${Date.now()}`, type: 'input',
            position: { x: 100, y: 100 },
            data: {
                name: finalCharacter.identity?.name || name, description: agent.description,
                role: finalCharacter.identity?.role || 'Onhandl Agent', persona,
                traits: finalCharacter.character?.traits || [], agentType,
                consoleOutput: [[`[${new Date().toLocaleTimeString()}] Agent ${name} initialized.`]],
            },
        };

        await AgentRepository.saveGraph(agent._id, graph, fallbackNode);
        return agent;
    },

    async createAgentFromTemplate(userId: string, templateId: string, name: string) {
        let workspace = await Workspace.findOne({ ownerId: userId });
        if (!workspace) {
            workspace = new Workspace({ name: 'Default Workspace', ownerId: userId, members: [userId] });
            await workspace.save();
        }

        const [user, planId] = await Promise.all([
            User.findById(userId).select('apiKeys').lean(),
            getUserPlan(userId),
        ]);
        const { provider, model } = resolveProviderKeys((user as any)?.apiKeys);

        // ── Plan enforcement: agent limit + template tier ─────────────────────
        const currentCount = await AgentRepository.count({ workspaceId: workspace._id });
        assertAgentLimit(planId, currentCount);

        const template = AgentTemplateService.getTemplateById(templateId);
        if (!template) throw { code: 404, message: 'Template not found' };
        assertTemplateAccess(planId, (template as any).tier ?? 'basic');

        const agent = await AgentRepository.create({
            ownerId: userId, workspaceId: workspace._id, name,
            description: (template as any).description, character: (template as any).character || {},
            agentType: (template as any).agentType || 'operational_agent', persona: (template as any).description,
            modelProvider: provider, modelConfig: { modelName: model || 'qwen2.5:3b' }, isDraft: true,
            graph: { nodes: (template as any).nodes, edges: (template as any).edges },
        });

        await AgentRepository.createTemplateGraph(agent._id, (template as any).nodes, (template as any).edges);
        return agent;
    },

    async previewEnhancePersona(
        name: string, persona: string, agentType: string = 'operational_agent',
        chains: string[] = [], userId?: string
    ) {
        let providerKeys = resolveProviderKeys({});
        if (userId) {
            const user = await User.findById(userId).select('apiKeys').lean();
            providerKeys = resolveProviderKeys((user as any)?.apiKeys);
        }
        return enhancePersona(name, persona, providerKeys.provider, providerKeys.apiKey, providerKeys.model, agentType, chains);
    }
};
