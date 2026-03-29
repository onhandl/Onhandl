import { trace, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('FlawLess-orchestrator');
const meter = metrics.getMeter('FlawLess-metrics');

// Define some basic metrics
const requestCounter = meter.createCounter('orchestrator_requests_total', {
    description: 'Total number of requests handled by the orchestrator',
});

const errorCounter = meter.createCounter('orchestrator_errors_total', {
    description: 'Total number of errors encountered in the orchestrator',
});

export const Telemetry = {
    startSpan: (name: string) => {
        return tracer.startSpan(name);
    },
    recordRequest: () => {
        requestCounter.add(1);
    },
    recordError: () => {
        errorCounter.add(1);
    }
};

// Application-wide Logger
export const Logger = {
    info: (msg: string, meta?: any) => {
        console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : '');
    },
    error: (msg: string, error?: any) => {
        console.error(`[ERROR] ${msg}`, error);
    },
    warn: (msg: string, meta?: any) => {
        console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : '');
    }
};
