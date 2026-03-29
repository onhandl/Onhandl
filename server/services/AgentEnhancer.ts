import { AIFactory } from '../lib/ai/factory';
import { ENV } from '../lib/environments';

import { financialAgentSchema } from '../characters/schemas/financial';
import { socialAgentSchema } from '../characters/schemas/social';
import { operationalAgentSchema } from '../characters/schemas/operational';

export class AgentEnhancer {
    static async enhancePersona(name: string, persona: string, providerName: string = 'ollama', customApiKey?: string, modelName?: string, agentType: string = 'operational_agent'): Promise<any> {
        const provider = AIFactory.getProvider(providerName);

        let targetSchema: any;
        switch (agentType) {
            case 'financial_agent': targetSchema = financialAgentSchema; break;
            case 'social_agent': targetSchema = socialAgentSchema; break;
            case 'operational_agent':
            default: targetSchema = operationalAgentSchema; break;
        }

        const prompt = `
You are an expert AI character designer for FlawLess, a decentralized agent platform.
Given an agent name, a summarized persona, and a strict target schema, expand the persona into a comprehensive character profile.

CRITICAL REQUIREMENT:
Your output MUST be a valid JSON object ONLY. 
You MUST strictly conform to the provided JSON Schema below. 
Fill out ALL strictly required fields thoroughly. For arrays of strings (like traits, allowed_actions, etc.), provide at least 3 thoughtful items.

TARGET JSON SCHEMA:
${JSON.stringify(targetSchema, null, 2)}

Agent Name: ${name}
Agent Type: ${agentType}
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
