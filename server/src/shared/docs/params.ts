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
const executionIdParamSchema = () => idParamSchema('Execution ID');

/** Developer API key record id param. */
export const keyIdParamSchema = () => idParamSchema('API key record ID');

/** Workspace id param. */
const workspaceIdParamSchema = () => idParamSchema('Workspace ID');

/** User id param. */
const userIdParamSchema = () => idParamSchema('User ID');

/** Common workspace header requirement for Scalar/OpenAPI docs. */
export const workspaceHeaderSchema = {
    type: 'object' as const,
    properties: {
        'x-workspace-id': { type: 'string' as const, description: 'The active workspace ID for this operation' },
    },
    required: ['x-workspace-id'] as string[],
    additionalProperties: true,
};

