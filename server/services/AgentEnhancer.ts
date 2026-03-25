import { AIFactory } from '../lib/ai/factory';
import { CharacterSchema } from '../characters/schema';
import { ENV } from '../lib/environments';

export class AgentEnhancer {
    static async enhancePersona(name: string, persona: string, providerName: string = 'gemini', customApiKey?: string): Promise<Partial<CharacterSchema> & { description?: string }> {
        const provider = AIFactory.getProvider(providerName);

        const prompt = `
You are an expert AI character designer for Omniflow, a blockchain-enabled agent platform on CKB and Fiber.
Given an agent name and a summarized persona, expand it into a comprehensive character schema.
The agent will be operating in a decentralized environment, so include traits or knowledge related to blockchain if implied, but keep the core personality based on the persona.

Output MUST be a valid JSON object ONLY, with no extra text.
Structure:
{
  "name": "string",
  "description": "string (A very brief 1-sentence summary of the agent to display on cards)",
  "bio": "string (engaging, 2-3 sentences)",
  "instructions": ["string (detailed system instructions on how the agent should behave)"],
  "traits": {
    "personality": ["string"],
    "knowledge": ["string"],
    "technical_skills": ["string"]
  }
}

Agent Name: ${name}
Summarized Persona: ${persona}
        `.trim();

        try {
            const response = await provider.generateCompletion({
                messages: [{ role: 'user', content: prompt }],
                provider: providerName as any,
                temperature: 0.8,
                apiKey: customApiKey || (providerName === 'openai' ? ENV.OPENAI_API_KEY : ENV.GEMINI_API_KEY)
            });

            // Extract JSON from response (handling potential markdown blocks)
            let jsonStr = response.content;
            if (jsonStr.includes('```json')) {
                jsonStr = jsonStr.split('```json')[1].split('```')[0];
            } else if (jsonStr.includes('```')) {
                jsonStr = jsonStr.split('```')[1].split('```')[0];
            }

            const enhancedData = JSON.parse(jsonStr.trim());
            return enhancedData;
        } catch (error) {
            console.error('[AgentEnhancer] Failed to enhance persona:', error);
            throw new Error('Failed to expand persona using AI. Please try again or provide manual details.');
        }
    }
}
