import { TelegramService } from '../../../infrastructure/messaging/telegram/telegram.service';
import { eventBus } from '../../../infrastructure/events/eventBus';
import { buildIdempotencyKey, IdempotencyService } from '../../../infrastructure/idempotency/idempotency.service';
import { TelegramEventNotifierRepository } from './telegram-event-notifier.repository';

const telegramClient = new TelegramService();

function asRecord(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object') return {};
    return input as Record<string, unknown>;
}

function stringifyValue(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

function formatTimestamp(raw: unknown): string {
    const n = typeof raw === 'number' ? raw : Number(raw);
    const date = Number.isFinite(n) && n > 0 ? new Date(n) : new Date();
    return date.toLocaleString('en-US', { hour12: false });
}

function pickAmountAndAsset(payload: Record<string, unknown>): { amount: string; asset: string } {
    const nested = asRecord(payload.payload);
    return {
        amount: stringifyValue(payload.amount || nested.amount) || '0',
        asset: stringifyValue(payload.asset || nested.asset) || 'TOKEN',
    };
}

function pickTxHash(payload: Record<string, unknown>): string {
    const nested = asRecord(payload.payload);
    return stringifyValue(payload.txHash || nested.txHash);
}

function buildNotificationText(input: {
    username: string;
    agentName: string;
    eventName: string;
    payload: Record<string, unknown>;
}): string {
    const { username, agentName, eventName, payload } = input;
    const nested = asRecord(payload.payload);
    const { amount, asset } = pickAmountAndAsset(payload);
    const at = formatTimestamp(payload.createdAt || nested.createdAt || Date.now());
    const txHash = pickTxHash(payload);

    let base: string;

    if (eventName === 'FUNDS.RECEIVED') {
        const fromAddress = stringifyValue(payload.payerAddress || nested.payerAddress || payload.from || nested.from) || 'unknown address';
        base = `Hello ${username}, ${agentName} has received ${amount} ${asset} from ${fromAddress} at ${at}.`;
    } else {
        const toAddress = stringifyValue(payload.to || nested.to || payload.recipientAddress || nested.recipientAddress) || 'unknown address';
        base = `Hello ${username}, ${agentName} has sent ${amount} ${asset} to ${toAddress} at ${at}.`;
    }

    if (!txHash) return base;
    return `${base}\nTransaction hash: ${txHash}`;
}

async function notifyForEvent(eventName: string, rawPayload: unknown) {
    if (!telegramClient.isConfigured()) return;

    const payload = asRecord(rawPayload);
    const nested = asRecord(payload.payload);
    const eventId = stringifyValue(payload.eventId || payload.id || nested.eventId || nested.id);
    const txHash = pickTxHash(payload);
    const workspaceId = stringifyValue(payload.workspaceId || nested.workspaceId);
    const agentId = stringifyValue(payload.agentId || nested.agentId);

    const recipients = await TelegramEventNotifierRepository.findTargetUsers({ workspaceId, agentId });
    if (recipients.length === 0) return;

    const agentName = (await TelegramEventNotifierRepository.findAgentName(agentId)) || 'Your agent';
    const uniquenessSeed = eventId || txHash || stringifyValue(payload.createdAt || nested.createdAt);

    for (const recipient of recipients as any[]) {
        const chatId = recipient?.telegram?.chatId;
        if (!chatId) continue;

        const key = buildIdempotencyKey([
            'tg-notify',
            eventName,
            uniquenessSeed || 'no-seed',
            agentId || 'no-agent-id',
            String(recipient._id),
            chatId,
        ]);

        const acquired = await IdempotencyService.acquire({
            scope: 'telegram-event-notifications',
            key,
            metadata: { eventName, eventId, txHash, agentId, workspaceId, userId: String(recipient._id) },
            lockMs: 10 * 60 * 1000,
        });

        if (!acquired.acquired) continue;

        const text = buildNotificationText({
            username: recipient?.username || 'there',
            agentName,
            eventName,
            payload,
        });

        try {
            await telegramClient.sendMessage(String(chatId), text);
            await IdempotencyService.complete({ scope: 'telegram-event-notifications', key });
        } catch (error: any) {
            await IdempotencyService.fail({
                scope: 'telegram-event-notifications',
                key,
                error: error?.message || 'send failed',
            });
        }
    }
}

const EVENT_NAMES = [
    'FUNDS.RECEIVED',
    'FUNDS.SENT',
    'FUNDS.TRANSFERRED',
] as const;

let notifierWired = false;

export function registerTelegramEventNotifier() {
    if (notifierWired) return;

    for (const eventName of EVENT_NAMES) {
        eventBus.on(eventName, async (payload: unknown) => {
            try {
                await notifyForEvent(eventName, payload);
            } catch (error: any) {
                console.error(`[telegram.notifier] ${eventName} failed: ${error?.message || String(error)}`);
            }
        });
    }

    notifierWired = true;
}
