import { TelegramService } from '../../../infrastructure/messaging/telegram.service';
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

function buildNotificationText(eventName: string, payload: Record<string, unknown>) {
    const agentId = stringifyValue(payload.agentId);
    const workspaceId = stringifyValue(payload.workspaceId);
    const actionType = stringifyValue(payload.type);
    const eventId = stringifyValue(payload.eventId || payload.id);
    const error = stringifyValue(payload.error);

    const lines = [
        `Agent event: ${eventName}`,
        agentId ? `Agent: ${agentId}` : '',
        workspaceId ? `Workspace: ${workspaceId}` : '',
        actionType ? `Action: ${actionType}` : '',
        eventId ? `Event ID: ${eventId}` : '',
        error ? `Error: ${error}` : '',
    ].filter(Boolean);

    return lines.join('\n');
}

async function notifyForEvent(eventName: string, rawPayload: unknown) {
    if (!telegramClient.isConfigured()) return;

    const payload = asRecord(rawPayload);
    const eventId = stringifyValue(payload.eventId || payload.id);
    const workspaceId = stringifyValue(payload.workspaceId);
    const agentId = stringifyValue(payload.agentId);

    const recipients = await TelegramEventNotifierRepository.findTargetUsers({ workspaceId, agentId });
    if (recipients.length === 0) return;

    const text = buildNotificationText(eventName, payload);

    for (const recipient of recipients as any[]) {
        const chatId = recipient?.telegram?.chatId;
        if (!chatId) continue;

        const key = buildIdempotencyKey([
            'tg-notify',
            eventName,
            eventId || 'no-event-id',
            agentId || 'no-agent-id',
            String(recipient._id),
            chatId,
        ]);

        const acquired = await IdempotencyService.acquire({
            scope: 'telegram-event-notifications',
            key,
            metadata: { eventName, eventId, agentId, workspaceId, userId: String(recipient._id) },
            lockMs: 10 * 60 * 1000,
        });

        if (!acquired.acquired) continue;

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
    'PAYMENT_LINK.PAID',
    'FUNDS.RECEIVED',
    'APPROVAL.GRANTED',
    'APPROVAL.REJECTED',
    'FINANCIAL_ACTION.STARTED',
    'FINANCIAL_ACTION.EXECUTED',
    'FINANCIAL_ACTION.COMPLETED',
    'FINANCIAL_ACTION.FAILED',
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
