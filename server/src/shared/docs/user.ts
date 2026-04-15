export const authUserSchema = {
    type: 'object' as const,
    required: ['_id', 'username', 'email'] as string[],
    properties: {
        _id: { type: 'string' as const },
        username: { type: 'string' as const },
        email: { type: 'string' as const },
    },
};