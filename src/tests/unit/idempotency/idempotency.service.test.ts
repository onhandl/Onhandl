import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { IdempotencyService, buildIdempotencyKey } from '../../../infrastructure/idempotency/idempotency.service';
import { IdempotencyKey } from '../../../infrastructure/database/models/IdempotencyKey';

describe('IdempotencyService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('buildIdempotencyKey', () => {
        it('safely stringifies and joins valid parts', () => {
            const key = buildIdempotencyKey(['FUNDS.RECEIVED', 'CKB', 123, 'tx_1']);
            expect(key).toBe('FUNDS.RECEIVED:CKB:123:tx_1');
        });

        it('ignores null, undefined, and empty string parts', () => {
            const key = buildIdempotencyKey(['FUNDS.RECEIVED', null, 'CKB', undefined, '', 'tx_1']);
            expect(key).toBe('FUNDS.RECEIVED:CKB:tx_1');
        });
    });

    describe('acquire', () => {
        it('returns acquired: true on successful insertion', async () => {
            vi.spyOn(IdempotencyKey, 'create').mockResolvedValue(true as any);

            const result = await IdempotencyService.acquire({
                scope: 'test-scope',
                key: 'test-key',
                lockMs: 1000
            });

            expect(result.acquired).toBe(true);
            expect(IdempotencyKey.create).toHaveBeenCalledWith(expect.objectContaining({
                scope: 'test-scope',
                key: 'test-key',
                status: 'processing',
                lockedUntil: expect.any(Date)
            }));
        });

        it('returns acquired: false and existing status on duplicate key error (E11000)', async () => {
            const duplicateError = new Error('E11000 duplicate key error collection') as any;
            duplicateError.code = 11000;

            vi.spyOn(IdempotencyKey, 'create').mockRejectedValue(duplicateError);
            vi.spyOn(IdempotencyKey, 'findOne').mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ status: 'completed' })
                })
            } as any);

            const result = await IdempotencyService.acquire({
                scope: 'test-scope',
                key: 'duplicate-key'
            });

            expect(result.acquired).toBe(false);
            expect(result.status).toBe('completed');
            expect(IdempotencyKey.findOne).toHaveBeenCalledWith({ scope: 'test-scope', key: 'duplicate-key' });
        });

        it('rethrows unexpected errors', async () => {
            const unexpectedError = new Error('Database connection failed');
            vi.spyOn(IdempotencyKey, 'create').mockRejectedValue(unexpectedError);

            await expect(IdempotencyService.acquire({ scope: 'test', key: 'test' }))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('complete', () => {
        it('updates idempotency record status to completed', async () => {
            vi.spyOn(IdempotencyKey, 'findOneAndUpdate').mockResolvedValue(true as any);

            await IdempotencyService.complete({
                scope: 'test-scope',
                key: 'test-key',
                metadata: { added: 'data' }
            });

            expect(IdempotencyKey.findOneAndUpdate).toHaveBeenCalledWith(
                { scope: 'test-scope', key: 'test-key' },
                {
                    $set: {
                        status: 'completed',
                        completedAt: expect.any(Date),
                        metadata: { added: 'data' }
                    }
                }
            );
        });
    });

    describe('fail', () => {
        it('updates idempotency record status to failed and merges error into metadata', async () => {
            vi.spyOn(IdempotencyKey, 'findOneAndUpdate').mockResolvedValue(true as any);

            await IdempotencyService.fail({
                scope: 'test-scope',
                key: 'test-key',
                error: 'Network timeout',
                metadata: { retryCount: 1 }
            });

            expect(IdempotencyKey.findOneAndUpdate).toHaveBeenCalledWith(
                { scope: 'test-scope', key: 'test-key' },
                {
                    $set: {
                        status: 'failed',
                        failedAt: expect.any(Date),
                        metadata: { retryCount: 1, error: 'Network timeout' }
                    }
                }
            );
        });
    });
});
