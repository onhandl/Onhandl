import { generateRandomAddress, generateRandomBalance, getCurrencyForNetwork } from './helpers';
import { nodeSuccess, nodeError, NodeOutput } from '../../../contracts/base';
import { CryptoWalletInputSchema, CryptoWalletResult } from '../../../contracts/node-contracts';

export async function simulateCryptoWallet(
  data: unknown,
  inputValues: Record<string, unknown>,
  agent?: unknown
): Promise<NodeOutput<CryptoWalletResult>> {
  const t0 = Date.now();
  const d = data as any;
  const ag = agent as any;

  const rawInput = {
    connectionType:
      (inputValues['connectionType'] as string) ??
      d?.inputs?.find((i: any) => i.key === 'connectionType')?.value ??
      'Wallet Address',
    network:
      (inputValues['network'] as string) ??
      d?.inputs?.find((i: any) => i.key === 'network')?.value ??
      'ckb-testnet',
    walletAddress:
      (inputValues['walletAddress'] as string) ??
      d?.inputs?.find((i: any) => i.key === 'walletAddress')?.value ??
      '',
    privateKey:
      (inputValues['privateKey'] as string) ??
      d?.inputs?.find((i: any) => i.key === 'privateKey')?.value ??
      '',
    storageType:
      (inputValues['storageType'] as 'temporary' | 'permanent') ??
      d?.inputs?.find((i: any) => i.key === 'storageType')?.value ??
      'temporary',
  };

  const validated = CryptoWalletInputSchema.safeParse(rawInput);
  if (!validated.success) {
    return nodeError(`Crypto Wallet input invalid: ${validated.error.message}`);
  }

  const { connectionType, network, walletAddress, privateKey, storageType } = validated.data as {
    connectionType: string;
    network: string;
    walletAddress?: string;
    privateKey?: string;
    storageType?: 'temporary' | 'permanent';
  };

  const walletType: string = (inputValues['walletType'] as string) ?? d?.walletType ?? 'System';
  const isManagedOrPermanent = walletType === 'System' || storageType === 'permanent';

  // Use existing managed/permanent wallet from agent record
  if (isManagedOrPermanent && ag?.blockchain) {
    const existing = ag.blockchain.find((b: any) => b.network === network);
    if (existing?.walletAddress) {
      return nodeSuccess<CryptoWalletResult>(
        {
          connected: true,
          address: existing.walletAddress,
          network,
          currency: getCurrencyForNetwork(network),
          balance: generateRandomBalance(network),
          connectionType: existing.walletType === 'managed' ? 'System' : 'MetaMask',
          lastUpdated: new Date().toISOString(),
        },
        { startedAt: t0 }
      );
    }
  }

  const canConnect =
    connectionType === 'Private Key'
      ? !!privateKey
      : connectionType === 'System' || !!walletAddress;

  if (!canConnect) {
    return nodeError('Wallet connection failed: missing address or credentials.', {
      connected: false,
      address: '',
      network,
      currency: getCurrencyForNetwork(network),
      balance: 0,
      connectionType,
      lastUpdated: new Date().toISOString(),
    });
  }

  const address = walletAddress || generateRandomAddress(network);
  const balance = generateRandomBalance(network);
  const currency = getCurrencyForNetwork(network);

  // Persist permanent wallets to agent record
  if (storageType === 'permanent' && ag) {
    if (!ag.blockchain) ag.blockchain = [];
    const idx = ag.blockchain.findIndex((b: any) => b.network === network);
    const record = {
      network,
      walletAddress: address,
      walletType: connectionType === 'System' ? 'managed' : 'externally_owned',
      ...(privateKey ? { privateKey } : {}),
    };
    if (idx >= 0) {
      ag.blockchain[idx] = record;
    } else {
      ag.blockchain.push(record);
    }
    await ag.save();
  }

  return nodeSuccess<CryptoWalletResult>(
    {
      connected: true,
      address,
      network,
      currency,
      balance,
      connectionType,
      lastUpdated: new Date().toISOString(),
    },
    { startedAt: t0 }
  );
}
