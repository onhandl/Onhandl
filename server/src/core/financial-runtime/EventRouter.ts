import { AgentRuntime } from './AgentRuntime';
import { RuntimeEvent } from './types';

export class EventRouter {
    constructor(private runtime: AgentRuntime) { }

    async route(event: RuntimeEvent): Promise<void> {
        await this.runtime.processEvent(event);
    }
}
