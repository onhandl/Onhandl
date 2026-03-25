// Simulate output node
export function simulateOutputNode(data: any, inputValues: Record<string, any>) {
    const outputs: Record<string, any> = {};

    // For each output defined in the node (usually just 'done' or similar)
    data.outputs?.forEach((output: any) => {
        outputs[output.key] = true;
    });

    // Store the final processed data
    outputs['finalData'] = inputValues;

    return outputs;
}
