import { randomUUID } from 'crypto';
import { EventRouter } from '../../../core/financial-runtime/EventRouter';
import { RuntimeEvent } from '../../../core/financial-runtime/types';
import { eventBus } from '../../../core/financial-runtime/eventBus';

function readString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function logRouteError(eventType: string, err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ckb.wiring] failed to route ${eventType}: ${message}`);
}

export function registerCkbWiring(router: EventRouter) {
    // Direct FUNDS.RECEIVED from CKB watcher
    eventBus.on('FUNDS.RECEIVED', async (payload: Record<string, unknown>) => {
        const workspaceId = readString(payload, 'workspaceId');
        const agentId = readString(payload, 'agentId');
        const amount = readString(payload, 'amount');
        const asset = readString(payload, 'asset');
        const chain = readString(payload, 'chain');
        const recipientAddress = readString(payload, 'recipientAddress');
        const txHash = readString(payload, 'txHash');

        if (!workspaceId || !agentId || !amount || !asset || !chain || !recipientAddress || !txHash) {
            console.warn('[ckb.wiring] FUNDS.RECEIVED missing required fields', payload);
            return;
        }

        // Only handle CKB events in this wiring
        if (chain !== 'CKB') {
            return;
        }

        const event: RuntimeEvent<'FUNDS.RECEIVED'> = {
            id: randomUUID(),
            type: 'FUNDS.RECEIVED',
            workspaceId,
            agentId,
            source: 'ckb-funds-watcher',
            payload: {
                amount,
                asset,
                chain,
                recipientAddress,
                payerAddress: readString(payload, 'payerAddress'),
                txHash,
            },
            createdAt: Date.now(),
        };

        try {
            await router.route(event);
        } catch (err) {
            logRouteError('FUNDS.RECEIVED', err);
        }
    });
}
