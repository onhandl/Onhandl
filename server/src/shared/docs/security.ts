/**
 * Shared OpenAPI security scheme references.
 * Use these in route `schema.security` arrays instead of inlining raw objects.
 */

/** HTTP-only `auth_token` cookie — used by all browser/app routes. */
export const cookieAuthSecurity = { cookieAuth: [] } as const;

/** `Authorization: Bearer <api-key>` — used by SDK/programmatic routes. */
const bearerAuthSecurity = { bearerAuth: [] } as const;
