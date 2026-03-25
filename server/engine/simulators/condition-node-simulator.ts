export function simulateConditionNode(data: any, inputValues: Record<string, any>) {
    const outputs: Record<string, any> = {};

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
    }

    outputs[isTrue ? 'true' : 'false'] = actualValue;
    outputs['conditionResult'] = isTrue;

    return outputs;
}
