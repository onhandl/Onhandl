import { nodeSuccess, NodeOutput } from '../../contracts/base';
import { OutputNodeResult } from '../../contracts/node-contracts';

export function simulateOutputNode(
  data: unknown,
  inputValues: Record<string, unknown>
): NodeOutput<OutputNodeResult> {
  const d = data as any;
  const format: OutputNodeResult['format'] =
    (d?.inputs?.find((i: any) => i.key === 'format')?.value as OutputNodeResult['format']) ??
    'Plain';

  const result = inputValues['result'] as Record<string, unknown> | null;
  let displayText = '';

  if (typeof result === 'object' && result !== null) {
    if (result.ckb !== undefined) {
      const addr = (result.address as string)?.substring(0, 8) ?? '';
      displayText = `Balance check complete. Address ${addr}... has ${result.ckb} CKB.`;
    } else if (result.txHash) {
      displayText = `Transfer successful! Tx: https://testnet.explorer.nervos.org/transaction/${result.txHash}`;
    } else if (result.error) {
      displayText = `Execution failed: ${result.error}`;
    } else if (result.intent && result.message) {
      displayText = String(result.message);
    } else {
      displayText = JSON.stringify(result, null, 2);
    }
  } else {
    displayText = String(
      result ??
      inputValues['displayText'] ??
      inputValues['value'] ??
      inputValues['message'] ??
      'Workflow execution completed.'
    );
  }

  return nodeSuccess<OutputNodeResult>({
    displayText,
    format,
    finalData: inputValues as Record<string, unknown>,
  });
}
