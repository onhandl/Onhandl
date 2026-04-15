import { allBlockchainTools, executeTool } from '../../../infrastructure/blockchain/index';
import { nodeSuccess, nodeError, NodeOutput, NodeMetadata } from '../../contracts/base';
import { BlockchainNodeInputSchema, BlockchainNodeResult } from '../../contracts/node-contracts';
import { timestamp } from './base';

export async function simulateBlockchainNode(
  data: unknown,
  inputValues: Record<string, unknown>,
  consoleOutput: string[]
): Promise<NodeOutput<BlockchainNodeResult>> {
  const t0 = Date.now();
  const d = data as any;

  const validated = BlockchainNodeInputSchema.safeParse(inputValues);
  if (!validated.success) {
    const msg = `Blockchain node input invalid: ${validated.error.message}`;
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }

  const toolName: string =
    d?.tool ??
    (inputValues['tool'] as string) ??
    d?.inputs?.find((i: any) => i.key === 'tool_lookup')?.value;

  if (!toolName) {
    const msg = 'No tool selected for blockchain node. Please select a tool in node settings.';
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }

  const tool = allBlockchainTools.find((t: any) => t.name === toolName);
  if (!tool) {
    const msg = `Blockchain tool not found: ${toolName}`;
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }

  consoleOutput.push(`${timestamp()} ⛓  Executing blockchain tool: ${toolName}`);

  // Build payload — runtime inputValues take priority over stale UI input defaults.
  // Priority: explicit params (node config) > runtime inputValues > fallback to inp.value
  const EXCLUDED_KEYS = new Set([
    'tool', 'tool_lookup', 'payload', 'walletData', 'walletInfo', 'outputData',
    'network', 'action_group',
  ]);

  const payload: Record<string, unknown> = { ...(d?.params ?? {}) };

  d?.inputs?.forEach((inp: any) => {
    if (EXCLUDED_KEYS.has(inp.key) || payload[inp.key] !== undefined) return;
    // Prefer runtime-resolved value over stale UI default
    const v = inputValues[inp.key] ?? inp.value;
    if (v !== undefined && v !== '') payload[inp.key] = v;
  });

  // Catch any inputValues keys not declared in d.inputs (e.g. upstream pipe outputs)
  for (const [k, v] of Object.entries(inputValues)) {
    if (!EXCLUDED_KEYS.has(k) && payload[k] === undefined && v !== undefined && v !== '') {
      payload[k] = v;
    }
  }

  // Forward wallet address from upstream wallet node (only when an actual wallet node is upstream)
  const walletSource = (inputValues['walletData'] ?? inputValues['walletInfo'] ?? null) as any;
  if (walletSource?.address) {
    if (payload['from'] === undefined) payload['from'] = walletSource.address;
    if (payload['address'] === undefined) payload['address'] = walletSource.address;
  }

  // Guard required params for known operations
  if (toolName.includes('get CKB balance') && !payload['address']) {
    const msg = 'Wallet address required. Connect a Crypto Wallet node upstream or provide an address.';
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }
  if (toolName.includes('transfer ckb') && (!payload['from'] || !payload['privateKey'])) {
    const msg = 'Sender wallet or private key missing. Connect a Crypto Wallet node upstream.';
    consoleOutput.push(`${timestamp()} ❌ ${msg}`);
    return nodeError(msg);
  }

  consoleOutput.push(`${timestamp()} 📦 Tool inputs: ${JSON.stringify(payload)}`);

  try {
    const rawResult = await executeTool(tool, payload);

    if (toolName.includes('get CKB balance')) {
      consoleOutput.push(`${timestamp()} ✅ Balance: ${rawResult.ckb} CKB (${rawResult.shannons} shannons)`);
    } else if (toolName.includes('transfer ckb')) {
      consoleOutput.push(`${timestamp()} ✅ Transfer successful. TxHash: ${rawResult.hash}`);
    }
    consoleOutput.push(`${timestamp()} ✅ Tool executed successfully.`);

    const meta: NodeMetadata = {
      executionMs: Date.now() - t0,
      toolName,
      network: (inputValues['network'] as string) ?? d?.chain ?? 'CKB',
    };

    return nodeSuccess<BlockchainNodeResult>(
      {
        data: rawResult,
        network: meta.network!,
        toolName,
        txHash: rawResult?.hash ?? rawResult?.txHash,
      },
      { metadata: meta }
    );
  } catch (err: any) {
    // Surface the real Zod validation error so users know which field is missing
    const display = err.message ?? 'Blockchain tool execution failed';
    consoleOutput.push(`${timestamp()} ❌ ${display}`);
    return nodeError(display, {}, { executionMs: Date.now() - t0, toolName, network: (inputValues['network'] as string) ?? 'CKB' });
  }
}
