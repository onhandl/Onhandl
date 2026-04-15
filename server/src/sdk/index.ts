/**
 * Omniflow SDK
 * Exposes core orchestration and feature logic for programmatic usage.
 * Never imports from or couples to `api/` or `app.ts`.
 */

export { FlowEngine } from '../core/engine/FlowEngine';
export { Orchestrator } from '../core/engine/orchestrator';

// Example wrap for easy SDK use
import { FlowEngine } from '../core/engine/FlowEngine';

export class OrchestrationSDK {
    async runExecution(executionId: string) {
        return FlowEngine.runExecution(executionId);
    }
}
