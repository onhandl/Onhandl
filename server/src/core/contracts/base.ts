/**
 * Standard I/O envelope for all node simulators.
 *
 * Every simulator returns NodeOutput<T> where T is the node-specific result shape.
 * Downstream nodes receive inputValues resolved from NodeOutput.result, not from
 * the envelope itself — the envelope metadata stays transparent to business logic.
 */

export interface NodeMetadata {
  /** Wall-clock ms the simulator took to execute */
  executionMs?: number;
  /** Simulator/tool version string */
  toolVersion?: string;
  /** AI model identifier used (AI nodes only) */
  modelUsed?: string;
  /** LLM token accounting (AI nodes only) */
  tokenUsage?: { prompt: number; completion: number; total: number };
  /** Blockchain network identifier (blockchain nodes only) */
  network?: string;
  /** Blockchain tool name invoked (blockchain nodes only) */
  toolName?: string;
}

export interface NodeOutput<T extends object = Record<string, unknown>> {
  /** The node-specific result payload — this is what downstream nodes receive */
  result: T;
  /** Execution outcome */
  status: 'success' | 'error';
  /**
   * Confidence score [0.0 – 1.0].
   * Deterministic nodes (blockchain, crypto, condition) return 1.0.
   * AI nodes return a model-derived score when available, otherwise 0.9.
   */
  confidence: number;
  /** ISO 8601 UTC timestamp of when the output was produced */
  timestamp: string;
  /** UUID v4 for end-to-end tracing across logs and SSE events */
  request_id: string;
  /** Human-readable summary — useful for errors and AI responses */
  message?: string;
  /** Optional extended diagnostics */
  metadata?: NodeMetadata;
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

export function nodeSuccess<T extends object>(
  result: T,
  opts?: {
    confidence?: number;
    message?: string;
    metadata?: NodeMetadata;
    startedAt?: number;
  }
): NodeOutput<T> {
  return {
    result,
    status: 'success',
    confidence: opts?.confidence ?? 1.0,
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID(),
    message: opts?.message,
    metadata: opts?.startedAt
      ? { ...(opts.metadata ?? {}), executionMs: Date.now() - opts.startedAt }
      : opts?.metadata,
  };
}

export function nodeError<T extends object = Record<string, unknown>>(
  message: string,
  partial?: Record<string, unknown>,
  metadata?: NodeMetadata
): NodeOutput<T> {
  return {
    result: (partial ?? {}) as T,
    status: 'error',
    confidence: 0,
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID(),
    message,
    metadata,
  };
}
