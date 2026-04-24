/**
 * Shared OpenAPI response schemas.
 *
 * Usage in route schemas:
 *   response: {
 *     200: describedResponseSchema(agentSchema, 'Agent details'),
 *     ...standardErrorResponses([401, 403, 404, 500]),
 *   }
 */

/** Standard error response shape: `{ error: string }` */
function errorResponseSchema(description = 'Error response') {
    return {
        description,
        type: 'object' as const,
        properties: {
            error: { type: 'string' as const },
        },
    };
}

/** Adds a description to a raw response schema. Pass `null` sparingly for `additionalProperties: true`. */
function describedResponseSchema(
    dataSchema: Record<string, unknown> | null,
    description = 'Success response',
) {
    if (dataSchema === null) {
        return {
            description,
            type: 'object' as const,
            additionalProperties: true as const,
        };
    }
    return { description, ...dataSchema };
}

/** Paginated list response. */
function paginationResponseSchema(
    itemSchema: Record<string, unknown>,
    description = 'Paginated results',
) {
    return {
        description,
        type: 'object' as const,
        properties: {
            items: { type: 'array' as const, items: itemSchema },
            total: { type: 'number' as const },
            page: { type: 'number' as const },
            limit: { type: 'number' as const },
        },
    };
}

// ── Canonical error descriptions (consistent wording across all routes) ────────

const ERROR_DESCRIPTIONS: Record<number, string> = {
    400: 'Validation error or missing required fields',
    401: 'Not authenticated — valid auth cookie or API key required',
    403: 'Forbidden — insufficient permissions, plan restriction, or invalid scope',
    404: 'Resource not found',
    409: 'Conflict — resource already exists',
    422: 'Unprocessable entity',
    429: 'Rate limit exceeded',
    500: 'Internal server error',
};

/**
 * Spreads standard error response schemas for the given HTTP status codes.
 *
 * @example
 * response: {
 *   200: agentSchema,
 *   ...standardErrorResponses([401, 403, 404, 500]),
 * }
 */
export function standardErrorResponses(codes: number[]): Record<number, ReturnType<typeof errorResponseSchema>> {
    return Object.fromEntries(
        codes.map((code) => [
            code,
            errorResponseSchema(ERROR_DESCRIPTIONS[code] ?? `Error ${code}`),
        ])
    ) as Record<number, ReturnType<typeof errorResponseSchema>>;
}

/** Convenience: the most common auth-protected error set. */
export const authErrorResponses = () => standardErrorResponses([401, 403, 500]);

/** Convenience: auth + resource-not-found set. */
export const resourceErrorResponses = () => standardErrorResponses([401, 403, 404, 500]);
