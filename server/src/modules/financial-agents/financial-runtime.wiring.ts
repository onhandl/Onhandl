import { AgentRuntime } from '../../core/financial-runtime/AgentRuntime';
import { EventRouter } from '../../core/financial-runtime/EventRouter';
import { registerAllRuntimes } from './financial-runtimes';

let wired = false;

export function createFinancialRuntimeWiring() {
    if (wired) return;

    const runtime = new AgentRuntime();
    const router = new EventRouter(runtime);

    registerAllRuntimes(router);

    wired = true;
}
