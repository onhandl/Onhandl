/**
 * RateLimiter
 * A simple in-memory rate limiter with a pluggable interface.
 */

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

class MemoryRateLimiter {
    private stores: Map<string, Map<string, { count: number; resetAt: number }>> = new Map();

    async check(key: string, limit: number, windowMs: number, category: string = 'default'): Promise<RateLimitResult> {
        if (!this.stores.has(category)) {
            this.stores.set(category, new Map());
        }
        const store = this.stores.get(category)!;
        const now = Date.now();
        const record = store.get(key);

        if (!record || now > record.resetAt) {
            const newRecord = { count: 1, resetAt: now + windowMs };
            store.set(key, newRecord);
            return { success: true, remaining: limit - 1, resetAt: newRecord.resetAt };
        }

        if (record.count >= limit) {
            return { success: false, remaining: 0, resetAt: record.resetAt };
        }

        record.count += 1;
        return { success: true, remaining: limit - record.count, resetAt: record.resetAt };
    }
}

export const rateLimiter = new MemoryRateLimiter();
