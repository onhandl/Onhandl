import { nodeSuccess, NodeOutput } from '../../contracts/base';
import { ConditionNodeResult } from '../../contracts/node-contracts';

type Condition = 'exists' | 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'intent_match';

function evaluate(condition: Condition, actual: unknown, compare?: unknown): boolean {
  switch (condition) {
    case 'exists':
      return actual !== undefined && actual !== null && actual !== '';
    case 'equals':
      return String(actual).toLowerCase() === String(compare).toLowerCase();
    case 'contains':
    case 'intent_match':
      return String(actual).toLowerCase().includes(String(compare).toLowerCase());
    case 'greaterThan':
      return Number(actual) > Number(compare);
    case 'lessThan':
      return Number(actual) < Number(compare);
    default:
      return false;
  }
}

export function simulateConditionNode(
  data: unknown,
  inputValues: Record<string, unknown>
): NodeOutput<ConditionNodeResult> {
  const d = data as any;

  // ── Multi-branch mode ──────────────────────────────────────────────────────
  if (Array.isArray(d?.branches) && d.branches.length > 0) {
    let matched = false;
    const resultBranches: Record<string, unknown> = {};

    for (const branch of d.branches) {
      const field: string = branch.field ?? 'intent';
      const condition: Condition = branch.condition ?? 'intent_match';
      const compareValue = branch.value;
      const isTrue = evaluate(condition, inputValues[field], compareValue);

      if (isTrue && branch.outputKey) {
        resultBranches[branch.outputKey] = {
          ...inputValues,
          conditionMatched: true,
          matchedBranch: branch.label ?? branch.outputKey,
        };
        matched = true;
        // Allow multiple branches to activate simultaneously (OR routing)
      }
    }

    // Default / else path when nothing matched
    if (!matched && d.defaultOutputKey) {
      resultBranches[d.defaultOutputKey] = {
        ...inputValues,
        conditionMatched: false,
        matchedBranch: 'default',
      };
    }

    return nodeSuccess<ConditionNodeResult>({
      conditionResult: matched,
      matchedBranch: matched ? Object.keys(resultBranches)[0] : 'default',
      ...resultBranches,
    });
  }

  // ── Simple if/else mode ───────────────────────────────────────────────────
  const condition: Condition =
    (d?.inputs?.find((i: any) => i.key === 'condition')?.value as Condition) ?? 'exists';
  const field: string = d?.inputs?.find((i: any) => i.key === 'field')?.value ?? 'result';
  const compareValue = d?.inputs?.find((i: any) => i.key === 'value')?.value;

  const isTrue = evaluate(condition, inputValues[field], compareValue);
  const branchKey = isTrue ? 'true' : 'false';

  return nodeSuccess<ConditionNodeResult>({
    conditionResult: isTrue,
    matchedBranch: branchKey,
    [branchKey]: { ...inputValues, conditionMatched: true },
  });
}
