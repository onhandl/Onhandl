import { EventEmitter } from 'events';

class ExecutionEmitter extends EventEmitter { }

// Global singleton to propagate execution logs to SSE connected clients
export const executionEmitter = new ExecutionEmitter();
