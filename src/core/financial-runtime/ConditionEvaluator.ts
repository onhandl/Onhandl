import { PolicyCondition } from './types';

export class ConditionEvaluator {
    static evaluate(conditions: PolicyCondition[], context: Record<string, unknown>): boolean {
        for (const condition of conditions) {
            const actual = this.getValue(context, condition.field);
            if (!this.evaluateSingle(actual, condition.op, condition.value)) return false;
        }
        return true;
    }

    private static evaluateSingle(actual: unknown, op: PolicyCondition['op'], expected: unknown): boolean {
        if (op === 'eq') return actual === expected;

        if (op === 'in') {
            if (!Array.isArray(expected)) return false;
            return expected.includes(actual);
        }

        const actualNum = this.toNumber(actual);
        const expectedNum = this.toNumber(expected);
        if (actualNum === null || expectedNum === null) return false;

        switch (op) {
            case 'gt': return actualNum > expectedNum;
            case 'gte': return actualNum >= expectedNum;
            case 'lt': return actualNum < expectedNum;
            case 'lte': return actualNum <= expectedNum;
            default: return false;
        }
    }

    private static toNumber(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '') {
            const n = Number(value);
            if (Number.isFinite(n)) return n;
        }
        return null;
    }

    private static getValue(source: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce<unknown>((acc, key) => {
            if (!acc || typeof acc !== 'object') return undefined;
            return (acc as Record<string, unknown>)[key];
        }, source);
    }
}
