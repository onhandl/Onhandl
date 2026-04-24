import { EventRouter } from '../../../core/financial-runtime/EventRouter';
import { registerCoreWiring } from './core.wiring';
import { registerCkbWiring } from './ckb.wiring';

export const financialRuntimeRegistries = [
    registerCoreWiring,
    registerCkbWiring,
];

export function registerAllRuntimes(router: EventRouter) {
    for (const register of financialRuntimeRegistries) {
        register(router);
    }
}
