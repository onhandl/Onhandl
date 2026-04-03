/** Stub — Telegram webhook service for live-mode-manager */
export const telegramService = {
    constructor: class {
        constructor(_botToken: string) {}
        async setWebhook(_url: string) { return { ok: false, description: 'Not implemented' } }
        async deleteWebhook() { return { ok: false } }
        async getWebhookInfo() { return { ok: false, result: null as { url?: string } | null } }
    },
}
