/**
 * Shared OpenAPI param schemas.
 * Use in route `schema.params` instead of repeating the same object shape.
 */

/** Generic single-id param schema. */
export function idParamSchema(description = 'Resource ID') {
    return {
        type: 'object' as const,
        required: ['id'] as string[],
        properties: {
            id: { type: 'string' as const, description },
        },
    };
}

/** Agent-specific id param. */
export const agentIdParamSchema = () => idParamSchema('Agent ID');

/** Execution-specific id param. */
export const executionIdParamSchema = () => idParamSchema('Execution ID');

/** Developer API key record id param. */
export const keyIdParamSchema = () => idParamSchema('API key record ID');

/** Purchase record id param. */
export const purchaseIdParamSchema = () => idParamSchema('Purchase record ID');
