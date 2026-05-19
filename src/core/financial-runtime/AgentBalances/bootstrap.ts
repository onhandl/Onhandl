import { registerBalanceAdapter } from './index';
import { syncCkbBalances } from './ckb/sync';

/**
 * Bootstraps the Agent Balances system by registering all available network adapters.
 * This should be called once during application startup.
 */
export function bootstrapAgentBalances() {
    // Register CKB adapter
    registerBalanceAdapter('CKB', syncCkbBalances);

    // Future adapters can be registered here:
    // registerBalanceAdapter('ETH', syncEthBalances);
}
