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

export const paymentLinkSchema = {
    type: 'object' as const,
    required: ['_id', 'workspaceId', 'chain', 'asset', 'recipientAddress', 'signerAddress', 'amount', 'link', 'status', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        workspaceId: { type: 'string' as const },
        agentId: { type: 'string' as const },
        createdBy: { type: 'string' as const },
        chain: { type: 'string' as const },
        asset: { type: 'string' as const },
        recipientAddress: { type: 'string' as const },
        signerAddress: { type: 'string' as const },
        amount: { type: 'string' as const },
        reference: { type: 'string' as const },
        memo: { type: 'string' as const },
        metadata: { type: 'object' as const, additionalProperties: { type: 'string' as const } },
        link: { type: 'string' as const },
        status: { type: 'string' as const, enum: ['active', 'paid', 'expired', 'cancelled'] },
        expiresAt: { type: 'string' as const, format: 'date-time' },
        fulfilledAt: { type: 'string' as const, format: 'date-time' },
        txHash: { type: 'string' as const },
        payerAddress: { type: 'string' as const },
        paidAmount: { type: 'string' as const },
        verificationData: { type: 'object' as const, additionalProperties: true as const },
        createdAt: { type: 'string' as const, format: 'date-time' },
        updatedAt: { type: 'string' as const, format: 'date-time' },
    },
};


export const notificationSettingsSchema = {
    type: 'object' as const,
    properties: {
        telegram: { type: 'boolean' as const },
        whatsapp: { type: 'boolean' as const },
        dailySummaries: { type: 'boolean' as const },
        email: { type: 'boolean' as const },
    },
};

export const userProfileSchema = {
    type: 'object' as const,
    required: ['_id', 'username', 'email'],
    properties: {
        ...userSchema.properties,
        whatsapp: { type: 'string' as const },
        telegram: {
            type: 'object' as const,
            properties: {
                linked: { type: 'boolean' as const },
                username: { type: 'string' as const },
                firstName: { type: 'string' as const },
                lastName: { type: 'string' as const },
                linkedAt: { type: 'string' as const, format: 'date-time' },
                lastAuthAt: { type: 'string' as const, format: 'date-time' },
            },
        },
        bio: { type: 'string' as const },
        planExpiry: { type: 'string' as const, format: 'date-time' },
        notifications: notificationSettingsSchema,
        profileViews: { type: 'number' as const },
        updatedAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const terminalSessionSchema = {
    type: 'object' as const,
    required: ['_id', 'deviceCode', 'userCode', 'status', 'expiresAt', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        deviceCode: { type: 'string' as const },
        userCode: { type: 'string' as const },
        status: { type: 'string' as const, enum: ['pending', 'approved', 'denied', 'expired'] },
        userId: { type: 'string' as const },
        workspaceId: { type: 'string' as const },
        deviceName: { type: 'string' as const },
        revoked: { type: 'boolean' as const },
        expiresAt: { type: 'string' as const, format: 'date-time' },
        createdAt: { type: 'string' as const, format: 'date-time' },
        updatedAt: { type: 'string' as const, format: 'date-time' },
    },
};

export const authUserSchema = {
    type: 'object' as const,
    required: ['_id', 'username', 'email'],
    properties: {
        _id: { type: 'string' as const },
        username: { type: 'string' as const },
        email: { type: 'string' as const },
    },
};


export const blogPostSchema = {
    type: 'object' as const,
    required: ['_id', 'title', 'body', 'authorId', 'authorName', 'createdAt'],
    properties: {
        _id: { type: 'string' as const },
        title: { type: 'string' as const },
        body: { type: 'string' as const },
        authorId: { type: 'string' as const },
        authorName: { type: 'string' as const },
        tags: { type: 'array' as const, items: { type: 'string' as const } },
        type: { type: 'string' as const },
        createdAt: { type: 'string' as const, format: 'date-time' as const },
        updatedAt: { type: 'string' as const, format: 'date-time' as const },
    },
};
