import { whatsAppService } from '../../services/whatsapp-service';
import { timestamp } from './base';

export async function simulateWhatsAppSendMessage(data: any, inputValues: Record<string, any>, consoleOutput: string[]) {
    const outputs: Record<string, any> = {};

    const phoneNumber = inputValues['phoneNumber'] || data.inputs?.find((input: any) => input.key === 'phoneNumber')?.value;
    const message = inputValues['message'] || data.inputs?.find((input: any) => input.key === 'message')?.value || 'Hello from FlawLess!';

    if (!phoneNumber) {
        const errorMsg = 'No phone number provided for WhatsApp message';
        consoleOutput.push(`${timestamp()} ❌ ${errorMsg}`);
        throw new Error(errorMsg);
    }

    consoleOutput.push(`${timestamp()} 📤 Sending WhatsApp message to ${phoneNumber}...`);

    try {
        const response = await whatsAppService.sendTextMessage(phoneNumber, message);

        consoleOutput.push(`${timestamp()} ✅ Message sent successfully via WhatsApp Cloud API`);
        outputs['result'] = response;
        outputs['status'] = 'success';
    } catch (error: any) {
        consoleOutput.push(`${timestamp()} ❌ WhatsApp API Error: ${error.message}`);
        outputs['error'] = error.message;
        outputs['status'] = 'error';
        throw error;
    }

    return outputs;
}
