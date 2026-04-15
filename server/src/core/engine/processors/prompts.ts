import { BaseProcessor } from './base-processor';

function inferAgentType(agent: any): 'financial_agent' | 'social_agent' | 'operational_agent' {
    const text = (`${agent?.name || ''} ${agent?.description || ''} ${agent?.persona || ''}`).toLowerCase();
    if (text.includes('ckb') || text.includes('finance') || text.includes('wallet') || text.includes('balance') || text.includes('transaction')) {
        return 'financial_agent';
    }
    if (text.includes('social') || text.includes('twitter') || text.includes('post') || text.includes('engagement') || text.includes('community')) {
        return 'social_agent';
    }
    return 'operational_agent';
}

export function getSpecializedSystemPrompt(agent: any, walletContext?: string): string {
    const identityContext = BaseProcessor.getIdentityContext(agent);
    const agentName = agent?.character?.identity?.name || agent?.name || 'Assistant';
    const agentType = agent?.agentType || agent?.character?.agent_type || agent?.agent_type || inferAgentType(agent);

    let domainInstructions = '';

    switch (agentType) {
        case 'financial_agent':
            domainInstructions = `
Strict Instructions for CKB Actions:
- You are an AI parameter extractor for the Nervos Layer 1 blockchain.
- You ONLY output valid JSON.
- If the user asks for their balance, check the AVAILABLE WALLETS section below.
- If a wallet is provided, set intent to "balance" and put that address in parameters.
- If NO wallet is provided, set intent to "general" and ask the user to provide an address.

JSON Schema (strictly follow):
{
  "intent": "balance" | "transfer" | "general",
  "parameters": {
    "address": "ckb_address_here",
    "to": "target_address_here",
    "amount": number_here
  },
  "message": "Direct response to user as ${agentName}"
}
`;
            break;

        case 'social_agent':
            domainInstructions = `
Strict Instructions for Social Interaction:
- You are an AI engagement specialist.
- You ONLY output valid JSON.
- Focus on community engagement, brand tone, and helpfulness.

JSON Schema (strictly follow):
{
  "intent": "reply" | "post" | "analyze" | "general",
  "tone": "detected tone of user",
  "message": "A creative, engaging response as ${agentName}"
}
`;
            break;

        case 'operational_agent':
            domainInstructions = `
Strict Instructions for Operational Tasks:
- You are an AI operations coordinator.
- You ONLY output valid JSON.
- Focus on scheduling, monitoring, and task coordination.

JSON Schema (strictly follow):
{
  "intent": "schedule" | "monitor" | "notify" | "general",
  "task": "description of the operational task",
  "schedule": "detected time or 'immediate'",
  "message": "A concise, efficient acknowledgment as ${agentName}"
}
`;
            break;
    }

    let prompt = `${identityContext}\n\n${domainInstructions}`;

    // Auto-inject stored agent wallets as context
    const agentWallets = agent?.blockchain || [];
    if (agentWallets.length > 0) {
        prompt += `\n\nCONTEXT - YOUR PERMANENT WALLETS:`;
        agentWallets.forEach((w: any) => {
            prompt += `\n- ${w.network}: ${w.walletAddress} (${w.walletType === 'managed' ? 'System Managed' : 'Externally Owned'})`;
        });
        prompt += `\nUse these when the user asks for 'my' balance or 'your' address.`;
    }

    if (walletContext) {
        prompt += `\n\nCONTEXT - CURRENT SESSION WALLET:\n${walletContext}`;
    }

    prompt += `\n\nReturn ONLY the JSON object. Do not provide any conversational filler outside the JSON.`;

    return prompt;
}
