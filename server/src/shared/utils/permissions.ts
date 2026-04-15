import { AuthContext } from '../contracts/auth';
import { scopeError } from '../errors';

/**
 * Valid SDK Scopes
 */
export type SDKScope =
    | '*'
    | 'executions:read'
    | 'executions:write'
    | 'agents:read'
    | 'agents:write'
    | 'marketplace:read'
    | 'marketplace:write'
    | 'sdk:simulate'
    | 'sdk:admin'
    | 'keys:read'
    | 'keys:write';

/**
 * Checks if the given auth context has the required scope.
 */
export function hasScope(auth: AuthContext, requiredScope: SDKScope): boolean {
    // Users (browser/app) bypass specific API key scope checks for now
    if (auth.type === 'user') return true;

    if (!auth.scopes || auth.scopes.length === 0) return false;

    // Wildcard bypass
    if (auth.scopes.includes('*')) return true;

    return auth.scopes.includes(requiredScope);
}

/**
 * Throws a structured AppError if the context lacks the required scope.
 */
export function assertScope(auth: AuthContext, requiredScope: SDKScope) {
    if (!hasScope(auth, requiredScope)) {
        throw scopeError(requiredScope);
    }
}
