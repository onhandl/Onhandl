/**
 * Evaluates a condition node.
 * Supports two modes:
 *   1. Simple mode: single condition → routes to 'true' or 'false' handles
 *   2. Multi-branch mode: array of branches → each routes to its own named handle
 *      Branch format: { condition, field, value, outputKey, label }
 */
export function simulateConditionNode(data: any, inputValues: Record<string, any>) {
    const outputs: Record<string, any> = {};

    // Multi-branch mode: data.branches is an array of { condition, field, value, outputKey, label }
    if (Array.isArray(data.branches) && data.branches.length > 0) {
        let matched = false;
        for (const branch of data.branches) {
            const field = branch.field || 'intent';
            const actualValue = inputValues[field];
            const condition = branch.condition || 'intent_match';
            const compareValue = branch.value;
            let isTrue = false;

            switch (condition) {
                case 'exists':
                    isTrue = actualValue !== undefined && actualValue !== null && actualValue !== '';
                    break;
                case 'equals':
                    isTrue = String(actualValue).toLowerCase() === String(compareValue).toLowerCase();
                    break;
                case 'contains':
                    isTrue = String(actualValue).toLowerCase().includes(String(compareValue).toLowerCase());
                    break;
                case 'intent_match':
                    isTrue = String(actualValue).toLowerCase().includes(String(compareValue).toLowerCase());
                    break;
                case 'greaterThan':
                    isTrue = Number(actualValue) > Number(compareValue);
                    break;
                case 'lessThan':
                    isTrue = Number(actualValue) < Number(compareValue);
                    break;
            }

            if (isTrue && branch.outputKey) {
                outputs[branch.outputKey] = { ...inputValues, conditionMatched: true, matchedBranch: branch.label || branch.outputKey };
                matched = true;
                // Don't break – allow multiple branches to activate in parallel (like an OR router)
            }
        }

        // Always include a default/else path if nothing matched
        if (!matched && data.defaultOutputKey) {
            outputs[data.defaultOutputKey] = { ...inputValues, conditionMatched: false, matchedBranch: 'default' };
        }

        outputs['conditionResult'] = matched;
        return outputs;
    }

    // ── Simple legacy mode: single condition → 'true' / 'false' ──────────────
    const condition = data.inputs?.find((input: any) => input.key === 'condition')?.value || 'exists';
    const field = data.inputs?.find((input: any) => input.key === 'field')?.value || 'result';
    const valueToCompare = data.inputs?.find((input: any) => input.key === 'value')?.value;

    const actualValue = inputValues[field];
    let isTrue = false;

    switch (condition) {
        case 'exists':
            isTrue = actualValue !== undefined && actualValue !== null && actualValue !== '';
            break;
        case 'equals':
            isTrue = String(actualValue) === String(valueToCompare);
            break;
        case 'contains':
            isTrue = String(actualValue).includes(String(valueToCompare));
            break;
        case 'greaterThan':
            isTrue = Number(actualValue) > Number(valueToCompare);
            break;
        case 'lessThan':
            isTrue = Number(actualValue) < Number(valueToCompare);
            break;
        case 'intent_match':
            // Check if the AI extracted intent matches the configured value
            isTrue = String(actualValue).toLowerCase().includes(String(valueToCompare).toLowerCase());
            break;
    }

    // Forward ALL upstream inputValues to the chosen path so parameters (address, amount) are preserved
    outputs[isTrue ? 'true' : 'false'] = { ...inputValues, conditionMatched: true };
    outputs['conditionResult'] = isTrue;

    return outputs;
}
