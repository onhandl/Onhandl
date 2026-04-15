import { BaseProcessor, ProcessorContext } from '../base-processor';
import { timestamp } from '../../simulators/base';
import { getSpecializedSystemPrompt } from '../prompts';

export class OperationalProcessor extends BaseProcessor {
    static async execute(ctx: ProcessorContext, inputText: string): Promise<any> {
        const { agent, consoleOutput } = ctx;
        const identityContext = BaseProcessor.getIdentityContext(agent);
        const agentName = agent?.character?.identity?.name || agent?.name || 'Operational Assistant';

        const systemPrompt = getSpecializedSystemPrompt(agent);

        const provider = agent?.modelProvider || 'ollama';
        const model = agent?.modelConfig?.modelName || 'qwen2.5:3b';

        consoleOutput.push(`${timestamp()} [Operational Processor] Consulting AI model ${model}...`);

        const response = await this.getCompletion(provider, model, systemPrompt, inputText);
        const jsonRes = this.parseJsonResponse(response.content, consoleOutput);

        if (jsonRes) {
            return {
                intent: jsonRes.intent,
                task: jsonRes.task,
                schedule: jsonRes.schedule,
                message: jsonRes.message,
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
