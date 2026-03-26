import { AIFactory } from '../lib/ai/factory';
import { CharacterSchema } from '../characters/schema';
import { ENV } from '../lib/environments';

export class AgentEnhancer {
    static async enhancePersona(name: string, persona: string, providerName: string = 'ollama', customApiKey?: string, modelName?: string): Promise<Partial<CharacterSchema> & { description?: string }> {
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
                model: modelName,
                temperature: 0.8,
                apiKey: customApiKey || (providerName === 'openai' ? ENV.OPENAI_API_KEY : providerName === 'ollama' ? ENV.OLLAMA_BASE_URL : ENV.GEMINI_API_KEY)
            });

            // Extract JSON from response (handling potential markdown blocks or extra text)
            let jsonStr = response.content || '';

            if (!jsonStr.trim()) {
                throw new Error('AI returned an empty response.');
            }

            // Look for JSON block
            const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonStr = jsonMatch[1];
            } else {
                // If no markdown block, try to find the first { and last }
                const startIdx = jsonStr.indexOf('{');
                const endIdx = jsonStr.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
                }
            }

            const enhancedData = JSON.parse(jsonStr.trim());
            return enhancedData;
        } catch (error: any) {
            const msg = error?.message || String(error);
            console.error('[AgentEnhancer] Failed to enhance persona:', msg);
            throw new Error(`Failed to expand persona using AI: ${msg}`);
        }
    }
}
