import { AppError } from './app-error';
import { ErrorCodes } from './codes';

/**
 * Centralized runtime error helpers.
 * Use these across services and controllers instead of ad hoc `throw { code, message }`.
 *
 * @example
 * // Before:
 * throw { code: 403, message: 'Plan limit exceeded' };
 *
 * // After:
 * throw planLimitError('Agent limit reached. Upgrade your plan to create more agents.');
 */

const unauthorizedError = (message = 'Not authenticated') =>
    new AppError(401, message, ErrorCodes.UNAUTHORIZED);

const forbiddenError = (message = 'You do not have permission to perform this action') =>
    new AppError(403, message, ErrorCodes.FORBIDDEN);

export const notFoundError = (resource = 'Resource') =>
    new AppError(404, `${resource} not found`, ErrorCodes.NOT_FOUND);

const conflictError = (message = 'Resource already exists') =>
    new AppError(409, message, ErrorCodes.CONFLICT);

const validationError = (message = 'Validation failed', details?: unknown) =>
    new AppError(400, message, ErrorCodes.VALIDATION_FAILED, details);

export const planLimitError = (message = 'Your current plan does not allow this action. Please upgrade.') =>
    new AppError(403, message, ErrorCodes.PLAN_LIMIT_EXCEEDED);

const scopeError = (scope?: string) =>
    new AppError(
        403,
        scope ? `API key is missing required scope: ${scope}` : 'API key does not have the required scope',
        ErrorCodes.SCOPE_REQUIRED,
    );

const invalidApiKeyError = (message = 'Invalid or revoked API key') =>
    new AppError(401, message, ErrorCodes.INVALID_API_KEY);

const rateLimitError = (message = 'Rate limit exceeded. Please slow down your requests.') =>
    new AppError(429, message, ErrorCodes.RATE_LIMIT_EXCEEDED);

const internalError = (message = 'An unexpected error occurred') =>
    new AppError(500, message, ErrorCodes.INTERNAL_ERROR);

/** Shared fastify error sender to eliminate verbose catch blocks. */
const sendError = (reply: any, err: any) => {
    if (err.code && typeof err.code === 'number') {
        return reply.code(err.code).send({ error: err.message, details: err.details });
    }
    return reply.code(500).send({ error: err.message || 'Internal server error' });
};
