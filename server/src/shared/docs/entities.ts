/**
 * Shared OpenAPI entity shape schemas.
 * Use in route `schema.response` to replace `additionalProperties: true` with
 * named, consistent shapes.
 *
 * These are intentionally permissive (no `required` unless truly always present)
 * to avoid schema validation friction on partial documents returned by some routes.
 */

export const userSchema = {
    type: 'object' as const,
    required: ['_id', 'username', 'email', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        username: { type: 'string' as const },
        email: { type: 'string' as const },
        name: { type: 'string' as const },
        plan: { type: 'string' as const },
        tokens: { type: 'number' as const },
        isAdmin: { type: 'boolean' as const },
        avatarUrl: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const agentSchema = {
    type: 'object' as const,
    required: ['_id', 'name', 'ownerId', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        name: { type: 'string' as const },
        description: { type: 'string' as const },
        persona: { type: 'string' as const },
        agentType: { type: 'string' as const },
        isDraft: { type: 'boolean' as const },
        ownerId: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
        updatedAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const executionSchema = {
    type: 'object' as const,
    required: ['_id', 'status', 'agentDefinitionId', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        status: { type: 'string' as const, enum: ['pending', 'running', 'completed', 'failed'] },
        agentDefinitionId: { type: 'string' as const },
        workspaceId: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const workspaceSchema = {
    type: 'object' as const,
    required: ['_id', 'name', 'ownerId', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        name: { type: 'string' as const },
        ownerId: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const apiKeyRecordSchema = {
    type: 'object' as const,
    required: ['_id', 'name', 'keyPrefix', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        name: { type: 'string' as const },
        keyPrefix: { type: 'string' as const },
        scopes: { type: 'array' as const, items: { type: 'string' as const } },
        createdAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const reviewSchema = {
    type: 'object' as const,
    required: ['_id', 'userId', 'agentId', 'rating', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        userId: { type: 'string' as const },
        agentId: { type: 'string' as const },
        rating: { type: 'number' as const },
        comment: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const ticketSchema = {
    type: 'object' as const,
    required: ['_id', 'subject', 'status', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        subject: { type: 'string' as const },
        message: { type: 'string' as const },
        status: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
    },
};
