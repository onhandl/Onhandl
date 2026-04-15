import mongoose from 'mongoose';
import { AgentRepository } from './agent.repository';
import { enhancePersona } from './agent-enhancer.service';
import { validateCharacter } from '../../core/characters/validator';
import { Workspace } from '../../infrastructure/database/models/Workspace';
import { User } from '../../infrastructure/database/models/User';
import { PLANS, PlanId } from '../../shared/constants/tokens';
import { getUserPlan, assertCanDelete, assertCanReEdit } from '../../shared/utils/plan-enforcement';

// ── List & filter ─────────────────────────────────────────────────────────────

export async function listAgents(userId: string, query: { isDraft?: string; status?: string; search?: string }) {
    let workspace = await Workspace.findOne({ ownerId: userId });
    if (!workspace) {
        workspace = new Workspace({ name: 'Default Workspace', ownerId: userId, members: [userId] });
        await workspace.save();
    }

    const filter: Record<string, unknown> = { workspaceId: workspace._id };
    const { isDraft, status, search } = query;

    if (status === 'published') filter.isDraft = false;
    else if (status === 'drafts') filter.isDraft = true;
    else if (status === 'listed') filter['marketplace.published'] = true;
    else if (isDraft !== undefined) filter.isDraft = isDraft === 'true';

    if (search?.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [{ name: regex }, { description: regex }];
    }

    return AgentRepository.findMany(filter);
}

// ── Get single agent with graph ───────────────────────────────────────────────

export async function getAgentWithGraph(id: string) {
    const agent = await AgentRepository.findById(id);
    if (!agent) return null;

    const { nodes, edges } = await AgentRepository.getGraph(id);
    return {
        ...agent.toObject(),
        graph: {
            nodes: nodes.map((n: any) => ({
                id: n.nodeId, type: n.type, position: n.position,
                data: { ...n.data, chain: n.chain, tool: n.tool, params: n.params },
            })),
            edges: edges.map((e: any) => ({
                id: e.edgeId, source: e.source, target: e.target,
                sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
                label: e.label, data: e.data,
            })),
        },
    };
}

// ── Plan status ───────────────────────────────────────────────────────────────

export async function getPlanStatus(userId: string) {
    const user = await User.findById(userId).select('tokens plan planExpiry');
    if (!user) throw { code: 404, message: 'User not found' };

    const workspace = await Workspace.findOne({ ownerId: userId });
    const agentCount = workspace ? await AgentRepository.count({ workspaceId: workspace._id }) : 0;
    const plan = PLANS[(user.plan as PlanId) || 'free'];

    return {
        plan: user.plan, tokens: user.tokens, agentCount,
        agentLimit: plan.agentLimit,
        atLimit: plan.agentLimit !== -1 && agentCount >= plan.agentLimit,
        canDelete: plan.canDelete, canReEdit: plan.canReEdit,
    };
}

// ── Update agent ──────────────────────────────────────────────────────────────

export interface UpdateAgentParams {
    id: string;
    userId?: string; // required for plan enforcement
    name?: string;
    description?: string;
    persona?: string;
    graph?: any;
    identities?: any;
    character?: any;
    isDraft?: boolean;
    provider?: string;
    apiKey?: string;
    model?: string;
    agentType?: string;
    log: (msg: string) => void;
}

export async function updateAgent(params: UpdateAgentParams) {
    const { id, userId, name, description, persona, graph, identities, character,
        isDraft, provider, apiKey, model, agentType, log } = params;

    if (userId) {
        const planId = await getUserPlan(userId);
        assertCanReEdit(planId);
    }

    const agent = await AgentRepository.findById(id);
    if (!agent) throw { code: 404, message: 'Agent not found' };

    const currentAgentType = agentType || (agent.character as any)?.agent_type || 'operational_agent';

    if (name) agent.name = name;
    if (description !== undefined) agent.description = description;
    if (identities) agent.identities = identities;
    if (isDraft !== undefined) agent.isDraft = isDraft;
    if (provider) agent.modelProvider = provider as any;
    else if (!agent.modelProvider) agent.modelProvider = 'ollama';
    if (model) agent.modelConfig.modelName = model;

    let intermediateCharacter = character ? { ...agent.character, ...character } : agent.character || {};

    if (persona && persona !== agent.persona && (!(intermediateCharacter as any).character?.bio || Object.keys(intermediateCharacter).length <= 1)) {
        const enhanced = await enhancePersona(name || agent.name, persona, provider || agent.modelProvider, apiKey, model || agent.modelConfig.modelName, currentAgentType);
        if (!enhanced.character || !enhanced.identity) throw new Error('AI generated an incomplete character.');
        intermediateCharacter = enhanced;
        agent.persona = persona;
        if (!description) agent.description = enhanced.identity?.description || enhanced.character?.bio;
    }

    if (Object.keys(intermediateCharacter).length > 0) {
        const validationResult = validateCharacter(currentAgentType, intermediateCharacter);
        if (!validationResult.isValid) throw { code: 400, message: 'Character Schema Validation Failed', details: validationResult.errors };
        agent.character = intermediateCharacter;
    }

    if (agentType) agent.agentType = agentType as any;
    await AgentRepository.save(agent);
    if (graph) await AgentRepository.syncGraph(id, graph);

    return agent;
}

// ── Delete agent ──────────────────────────────────────────────────────────────

export async function deleteAgent(id: string, userId?: string) {
    if (userId) {
        const planId = await getUserPlan(userId);
        assertCanDelete(planId);
    }
    const agent = await AgentRepository.findByIdAndDelete(id);
    if (!agent) throw { code: 404, message: 'Agent not found' };
    await AgentRepository.deleteGraph(id);
    return agent;
}
