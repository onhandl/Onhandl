import { ErrorCode } from './codes';

/**
 * Structured application error. Throw this from services; controllers catch it
 * and reply with the matching HTTP status.
 *
 * Rules:
 * - `code` is the HTTP status to send (400, 401, 403, 404, 409, 429, 500 …)
 * - `errorCode` is the machine-readable code from `ErrorCodes`
 * - `details` is optional extra context (validation messages, etc.)
 *
 * @example
 * throw new AppError(404, 'Agent not found', ErrorCodes.NOT_FOUND);
 */
export class AppError extends Error {
    constructor(
        public readonly code: number,
        message: string,
        public readonly errorCode?: ErrorCode,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
        // Maintains proper prototype chain in transpiled ES5
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /** Shape that controllers send in the reply body. */
    toJSON() {
        return {
            error: this.message,
            errorCode: this.errorCode,
            details: this.details,
        };
    }

    /** True if the thrown value is an AppError instance. */
    static is(value: unknown): value is AppError {
        return value instanceof AppError;
    }

    /**
     * Normalize any thrown value into an AppError.
     * Useful in catch blocks that may receive AppError or a raw `{ code, message }` object.
     */
    static from(err: unknown): AppError {
        if (err instanceof AppError) return err;
        if (err && typeof err === 'object' && 'message' in err && 'code' in err) {
            const e = err as { code: number; message: string };
            return new AppError(e.code, e.message);
        }
        if (err instanceof Error) {
            return new AppError(500, err.message);
        }
        return new AppError(500, 'An unexpected error occurred');
    }
}
