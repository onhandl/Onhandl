import { BaseProcessor, ProcessorContext } from '../base-processor';
import { timestamp } from '../../simulators/base';
import { getSpecializedSystemPrompt } from '../prompts';

export class CKBProcessor extends BaseProcessor {
    static async execute(ctx: ProcessorContext, inputText: string): Promise<any> {
        const { agent, consoleOutput, inputValues } = ctx;
        const identityContext = BaseProcessor.getIdentityContext(agent);
        const agentName = agent?.character?.identity?.name || agent?.name || 'CKB Assistant';

        // Wallet context
        const agentWallets = agent?.blockchain || [];
        const walletInfoFromInput = inputValues['walletInfo'] || (inputValues['connected'] ? inputValues : null);

        const walletContext = walletInfoFromInput?.address ? `- Current Session Wallet: ${walletInfoFromInput.address}` : '';
        const systemPrompt = getSpecializedSystemPrompt(agent, walletContext);

        const provider = agent?.modelProvider || 'ollama';
        const model = agent?.modelConfig?.modelName || 'qwen2.5:3b';

        consoleOutput.push(`${timestamp()} [CKB Processor] Consulting AI model ${model}...`);

        const response = await this.getCompletion(provider, model, systemPrompt, inputText);
        const jsonRes = this.parseJsonResponse(response.content, consoleOutput);

        if (jsonRes) {
            return {
                intent: jsonRes.intent,
                message: jsonRes.message,
                ...jsonRes.parameters,
                result: jsonRes
            };
        }

        return {
            intent: 'general',
            message: response.content,
            result: response.content
        };
    }
}
