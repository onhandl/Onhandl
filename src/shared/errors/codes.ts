/**
 * Centralized application error codes.
 *
 * These are machine-readable codes for structured error responses.
 * Every AppError has an optional `errorCode` from this set so clients
 * can pattern-match on codes without parsing message strings.
 */
export const ErrorCodes = {
    // Auth
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Resources
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',

    // Input
    VALIDATION_FAILED: 'VALIDATION_FAILED',

    // Plan & billing
    PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',

    // SDK / API keys
    SCOPE_REQUIRED: 'SCOPE_REQUIRED',
    INVALID_API_KEY: 'INVALID_API_KEY',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
