import { AIFactory } from '../../infrastructure/ai/factory';
import { ENV } from '../../shared/config/environments';

import { financialAgentSchema } from '../../core/characters/schemas/financial';
import { socialAgentSchema } from '../../core/characters/schemas/social';
import { operationalAgentSchema } from '../../core/characters/schemas/operational';

export class AgentEnhancer {
    static async enhancePersona(name: string, persona: string, providerName: string = 'ollama', customApiKey?: string, modelName?: string, agentType: string = 'operational_agent', chains: string[] = []): Promise<any> {
        const provider = AIFactory.getProvider(providerName);

        let targetSchema: any;
        switch (agentType) {
            case 'financial_agent': targetSchema = financialAgentSchema; break;
            case 'social_agent': targetSchema = socialAgentSchema; break;
            case 'operational_agent':
            default: targetSchema = operationalAgentSchema; break;
        }

        const chainConstraint = chains.length > 0
            ? `
BLOCKCHAIN CONSTRAINTS (MANDATORY — embed these rules into the character's instructions and behaviour):
- This agent is authorised to operate EXCLUSIVELY on the following networks: ${chains.join(', ')}.
- The agent MUST NEVER initiate, sign, or relay transactions on any network not in that list.
- Before executing any transaction, the agent MUST verify that the target chain matches one of its authorised networks and explicitly confirm this to the user.
- If a user requests an action on an unauthorised chain, the agent must refuse and explain which chains it is permitted to use.
- These constraints are non-negotiable and must be reflected in the character's system instructions and allowed_actions fields.`
            : '';

        const prompt = `
You are an expert AI character designer for Onhandl, a decentralized agent platform.
Given an agent name, a summarized persona, and a strict target schema, expand the persona into a comprehensive character profile.

CRITICAL REQUIREMENT:
Your output MUST be a valid JSON object ONLY.
You MUST strictly conform to the provided JSON Schema below.
Fill out ALL strictly required fields thoroughly. For arrays of strings (like traits, allowed_actions, etc.), provide at least 3 thoughtful items.
${chainConstraint}
TARGET JSON SCHEMA:
${JSON.stringify(targetSchema, null, 2)}

Agent Name: ${name}
Agent Type: ${agentType}
Authorised Chains: ${chains.length > 0 ? chains.join(', ') : 'none specified — do not assume any chain'}
Summarized Persona: ${persona}
        `.trim();

        try {
            const response = await provider.generateCompletion({
                messages: [{ role: 'user', content: prompt }],
                provider: providerName as any,
                model: modelName,
                temperature: 0.8,
                apiKey: customApiKey || (providerName === 'openai' ? ENV.OPENAI_API_KEY : providerName === 'ollama' ? ENV.OLLAMA_BASE_URL : ENV.GEMINI_API_KEY)
            });

            let jsonStr = response.content || '';

            if (!jsonStr.trim()) {
                throw new Error('AI returned an empty response.');
            }

            const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonStr = jsonMatch[1];
            } else {
                const startIdx = jsonStr.indexOf('{');
                const endIdx = jsonStr.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
                }
            }

            const enhancedData = JSON.parse(jsonStr.trim());
            enhancedData.agent_type = agentType;
            return enhancedData;
        } catch (error: any) {
            const msg = error?.message || String(error);
            console.error('[AgentEnhancer] Failed to enhance persona:', msg);
            throw new Error(`Failed to expand persona using AI: ${msg}`);
        }
    }
}
