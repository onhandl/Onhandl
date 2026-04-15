export interface CharacterSchema {
    name?: string;
    username?: string;
    bio?: string;
    instructions?: string[]; // System prompts
    traits?: {
        personality?: string[];
        knowledge?: string[];
        technical_skills?: string[];
    };
    tools?: string[]; // List of tool names the agent can use
    voice?: {
        provider: string;
        voice_id: string;
    };
    social_presence?: {
        twitter?: string;
        telegram?: string;
        discord?: string;
    };
    agent_type?: string;
    [key: string]: any; // Allows extending with dynamic validation schema fields
}
