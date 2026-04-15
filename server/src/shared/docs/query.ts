/**
 * Shared OpenAPI querystring schemas.
 * Use in route `schema.querystring` instead of repeating common patterns.
 */

export const paginationQuerySchema = {
    type: 'object' as const,
    properties: {
        page: { type: 'integer' as const, minimum: 1, default: 1, description: 'Page number (1-indexed)' },
        limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 20, description: 'Items per page' },
    },
};

export const searchQuerySchema = {
    type: 'object' as const,
    properties: {
        search: { type: 'string' as const, description: 'Search term' },
    },
};

export const paginatedSearchQuerySchema = {
    type: 'object' as const,
    properties: {
        page: { type: 'integer' as const, minimum: 1, default: 1, description: 'Page number (1-indexed)' },
        limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 20, description: 'Items per page' },
        search: { type: 'string' as const, description: 'Search term' },
    },
};
