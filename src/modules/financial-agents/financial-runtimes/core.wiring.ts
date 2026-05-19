import { randomUUID } from 'crypto';
import { EventRouter } from '../../../core/financial-runtime/EventRouter';
import { RuntimeEvent } from '../../../core/financial-runtime/types';
import { eventBus } from '../../../core/financial-runtime/eventBus';

function readString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function readNumber(payload: Record<string, unknown>, key: string): number | undefined {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function logRouteError(eventType: string, err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[core.wiring] failed to route ${eventType}: ${message}`);
}

export function registerCoreWiring(router: EventRouter) {
    eventBus.on('PAYMENT_LINK.PAID', async (payload: Record<string, unknown>) => {
        const workspaceId = readString(payload, 'workspaceId');
        const paymentLinkId = readString(payload, 'paymentLinkId');
        const amount = readString(payload, 'amount');
        const asset = readString(payload, 'asset');
        const chain = readString(payload, 'chain');
        const recipientAddress = readString(payload, 'recipientAddress');
        const txHash = readString(payload, 'txHash');

        if (!workspaceId || !paymentLinkId || !amount || !asset || !chain || !recipientAddress || !txHash) {
            return;
        }

        const payerAddress = readString(payload, 'payerAddress');

        const fundsReceivedEvent: RuntimeEvent<'FUNDS.RECEIVED'> = {
            id: randomUUID(),
            type: 'FUNDS.RECEIVED',
            workspaceId,
            source: 'payment-link-verification',
            payload: {
                amount,
                asset,
                chain,
                recipientAddress,
                payerAddress,
                txHash,
            },
            createdAt: Date.now(),
        };

        try {
            await router.route(fundsReceivedEvent);
        } catch (err) {
            logRouteError('FUNDS.RECEIVED', err);
        }
    });

    eventBus.on('APPROVAL.GRANTED', async (payload: Record<string, unknown>) => {
        const workspaceId = readString(payload, 'workspaceId');
        const approvalRequestId = readString(payload, 'approvalRequestId');
        const agentId = readString(payload, 'agentId');
        if (!workspaceId || !approvalRequestId || !agentId) return;

        const event: RuntimeEvent<'APPROVAL.GRANTED'> = {
            id: randomUUID(),
            type: 'APPROVAL.GRANTED',
            workspaceId,
            agentId,
            source: 'approval-service',
            payload: {
                approvalRequestId,
                agentId,
                action: payload.action,
                resolvedAt: readNumber(payload, 'resolvedAt') ?? Date.now(),
            },
            createdAt: Date.now(),
        };

        try {
            await router.route(event);
        } catch (err) {
            logRouteError('APPROVAL.GRANTED', err);
        }
    });

    eventBus.on('APPROVAL.REJECTED', async (payload: Record<string, unknown>) => {
        const workspaceId = readString(payload, 'workspaceId');
        const approvalRequestId = readString(payload, 'approvalRequestId');
        const agentId = readString(payload, 'agentId');
        if (!workspaceId || !approvalRequestId || !agentId) return;

        const event: RuntimeEvent<'APPROVAL.REJECTED'> = {
            id: randomUUID(),
            type: 'APPROVAL.REJECTED',
            workspaceId,
            agentId,
            source: 'approval-service',
            payload: {
                approvalRequestId,
                agentId,
                action: payload.action,
                resolvedAt: readNumber(payload, 'resolvedAt') ?? Date.now(),
            },
            createdAt: Date.now(),
        };

        try {
            await router.route(event);
        } catch (err) {
            logRouteError('APPROVAL.REJECTED', err);
        }
    });
}
