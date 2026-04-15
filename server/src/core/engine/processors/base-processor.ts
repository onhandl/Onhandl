import { AIFactory } from '../../../infrastructure/ai/factory';
import { timestamp } from '../simulators/base';

export interface ProcessorContext {
    agent?: any;
    inputValues: Record<string, any>;
    consoleOutput: string[];
}

export class BaseProcessor {
    static getIdentityContext(agent: any): string {
        const character = agent?.character;
        const identity = character?.identity;
        const personaBio = character?.character?.bio || agent?.persona;
        const traits = character?.character?.traits || [];

        const agentName = identity?.name || agent?.name || 'an AI assistant';
        const agentType = character?.agent_type || agent?.agent_type || 'general';
        let context = `You are ${agentName}, a specialized ${agentType.replace('_', ' ')}.`;
        if (identity?.role) context += ` Your role is: ${identity.role}.`;
        if (personaBio) context += `\nBio: ${personaBio}`;
        if (traits.length > 0) context += `\nTraits: ${traits.join(', ')}`;

        return context;
    }

    static async getCompletion(providerName: string, modelName: string, systemPrompt: string, userText: string): Promise<any> {
        const aiProvider = AIFactory.getProvider(providerName);
        return await aiProvider.generateCompletion({
            provider: providerName as any,
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userText }
            ],
            temperature: 0.1,
        });
    }

    static parseJsonResponse(content: string, consoleOutput: string[]): any {
        try {
            // Extract content between the first { and the last }
            const match = content.match(/\{[\s\S]*\}/);
            if (!match) throw new Error("No JSON object found");
            const cleanJson = match[0].trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            consoleOutput.push(`${timestamp()} ⚠️ AI did not return valid JSON, using raw text fallback.`);
            return null;
        }
    }
}
