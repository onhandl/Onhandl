import '@fastify/jwt';

/**
 * Authenticated user payload attached by request.jwtVerify()
 *
 * Keep this minimal and stable.
 * Only include fields that are actually present in your JWT payload
 * or returned by formatUser.
 */
export interface AuthenticatedUser {
  id: string;
  username?: string;
  email?: string;
  isAdmin?: boolean;
  role?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}