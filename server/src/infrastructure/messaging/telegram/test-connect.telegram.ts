import { Telegraf } from "telegraf";
import { ENV } from "../../../shared/config/environments";

export const testConnectTelegram = async () => {
    const bot = new Telegraf(ENV.TELEGRAM_BOT_TOKEN!);
    
    try {
        const botName = (await bot.telegram.getMe()).first_name;
        console.log('✅ Telegram connection successful!');
        console.log('Service Name:', botName);
        return { success: true, botName };
    } catch (error) {
        console.error('❌ Telegram connection failed:', error);
        return { success: false, error };
    }
}

// Only run if called directly (not imported)
if (require.main === module) {
    testConnectTelegram();
}