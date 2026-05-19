import { IdempotencyKey } from '../database/models/IdempotencyKey';

export function buildIdempotencyKey(parts: Array<string | number | undefined | null>): string {
    return parts
        .filter((part) => part !== undefined && part !== null && part !== '')
        .map(String)
        .join(':');
}

export const IdempotencyService = {
    /**
     * Attempts to acquire an idempotency lock for the given scope and key.
     */
    async acquire(input: {
        scope: string;
        key: string;
        metadata?: Record<string, unknown>;
        lockMs?: number;
    }): Promise<{ acquired: boolean; status?: string }> {
        const { scope, key, metadata, lockMs = 60000 } = input;
        const lockedUntil = new Date(Date.now() + lockMs);

        try {
            await IdempotencyKey.create({
                scope,
                key,
                status: 'processing',
                metadata,
                lockedUntil,
            });
            return { acquired: true };
        } catch (error: any) {
            // E11000 is the MongoDB duplicate key error code
            if (error.code === 11000) {
                const existing = await IdempotencyKey.findOne({ scope, key }).select('status').lean();
                return { acquired: false, status: existing?.status || 'unknown' };
            }
            throw error;
        }
    },

    /**
     * Marks an idempotency record as completed successfully.
     */
    async complete(input: {
        scope: string;
        key: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        const { scope, key, metadata } = input;
        await IdempotencyKey.findOneAndUpdate(
            { scope, key },
            {
                $set: {
                    status: 'completed',
                    completedAt: new Date(),
                    ...(metadata ? { metadata } : {}),
                },
            }
        );
    },

    /**
     * Marks an idempotency record as failed.
     */
    async fail(input: {
        scope: string;
        key: string;
        error?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        const { scope, key, error, metadata } = input;

        let mergedMetadata = metadata || {};
        if (error) {
            mergedMetadata = { ...mergedMetadata, error };
        }

        await IdempotencyKey.findOneAndUpdate(
            { scope, key },
            {
                $set: {
                    status: 'failed',
                    failedAt: new Date(),
                    ...(Object.keys(mergedMetadata).length > 0 ? { metadata: mergedMetadata } : {}),
                },
            }
        );
    },
};
