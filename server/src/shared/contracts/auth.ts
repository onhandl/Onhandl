import '@fastify/jwt';

/**
 * Authenticated user payload attached by request.jwtVerify()
 */
interface AuthenticatedUser {
    id: string;
    username?: string;
    email?: string;
    isAdmin?: boolean;
    role?: string;
    workspaceId?: string;
    type?: string;
}

export interface ApiKeyAuthContext {
    type: 'api_key';
    userId: string;
    workspaceId: string;
    apiKeyId: string;
    scopes: string[];
}

interface JwtAuthContext {
    type: 'user';
    userId: string;
    workspaceId?: string;
    user?: AuthenticatedUser;
    scopes?: string[];
}

interface TerminalAuthContext {
    type: 'terminal';
    userId: string;
    workspaceId?: string;
    scopes?: string[];
}

type AuthContext = JwtAuthContext | ApiKeyAuthContext | TerminalAuthContext;

declare module 'fastify' {
    interface FastifyRequest {
        apiKeyAuth?: ApiKeyAuthContext;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: AuthenticatedUser;
        user: AuthenticatedUser;
    }
}