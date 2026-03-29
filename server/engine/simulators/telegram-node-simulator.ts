import { telegramService } from '../../services/telegram-service';
import { timestamp } from './base';

export async function simulateTelegramSendMessage(data: any, inputValues: Record<string, any>, consoleOutput: string[]) {
    const outputs: Record<string, any> = {};

    const chatId = inputValues['chatId'] || data.inputs?.find((input: any) => input.key === 'chatId')?.value;
    const message = inputValues['message'] || data.inputs?.find((input: any) => input.key === 'message')?.value || 'Hello from FlawLess!';

    if (!chatId) {
        const errorMsg = 'No Chat ID provided for Telegram message';
        consoleOutput.push(`${timestamp()} ❌ ${errorMsg}`);
        throw new Error(errorMsg);
    }

    consoleOutput.push(`${timestamp()} 📤 Sending Telegram message to ${chatId}...`);

    try {
        const response = await telegramService.sendMessage(chatId, message);

        if (response.ok) {
            consoleOutput.push(`${timestamp()} ✅ Message sent successfully to Telegram`);
            outputs['result'] = response.result;
            outputs['status'] = 'success';
        } else {
            consoleOutput.push(`${timestamp()} ❌ Telegram API Error: ${response.description}`);
            outputs['error'] = response.description;
            outputs['status'] = 'error';
        }
    } catch (error: any) {
        consoleOutput.push(`${timestamp()} ❌ Error: ${error.message}`);
        outputs['error'] = error.message;
        outputs['status'] = 'error';
        throw error;
    }

    return outputs;
}
