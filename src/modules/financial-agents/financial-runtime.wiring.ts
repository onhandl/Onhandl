import { AgentRuntime } from '../../core/financial-runtime/AgentRuntime';
import { EventRouter } from '../../core/financial-runtime/EventRouter';
import { registerAllRuntimes } from './financial-runtimes';
import { registerTelegramEventNotifier } from './telegram/telegram-event-notifier.service';

let wired = false;

export function createFinancialRuntimeWiring() {
    if (wired) return;

    const runtime = new AgentRuntime();
    const router = new EventRouter(runtime);

    registerAllRuntimes(router);
    registerTelegramEventNotifier();

    wired = true;
}
