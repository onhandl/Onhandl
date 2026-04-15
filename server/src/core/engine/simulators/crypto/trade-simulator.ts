import { generateRandomTxId, generateRandomPrice } from './helpers';
import { nodeSuccess, nodeError, NodeOutput } from '../../../contracts/base';
import { CryptoTradeInputSchema, CryptoTradeResult } from '../../../contracts/node-contracts';

export function simulateCryptoTrade(
  data: unknown,
  inputValues: Record<string, unknown>
): NodeOutput<CryptoTradeResult> {
  const t0 = Date.now();
  const d = data as any;

  // Resolve walletInfo from upstream — handle both direct and nested shapes
  let walletInfo: any =
    inputValues['walletInfo'] ??
    d?.inputs?.find((i: any) => i.key === 'walletInfo')?.value ??
    null;

  if (walletInfo?.walletInfo) walletInfo = walletInfo.walletInfo;
  if (walletInfo && !walletInfo.address && walletInfo.wallet) {
    walletInfo = {
      address: walletInfo.wallet,
      network: walletInfo.network ?? 'Ethereum',
      connected: true,
    };
  }

  const isWalletConnected = walletInfo && (walletInfo.connected === true || walletInfo.address);
  if (!isWalletConnected) {
    return nodeError('No wallet connected. Connect a Crypto Wallet node upstream.');
  }

  const validated = CryptoTradeInputSchema.safeParse({
    walletInfo,
    action: inputValues['action'] ?? d?.inputs?.find((i: any) => i.key === 'action')?.value ?? 'Buy',
    token: inputValues['token'] ?? d?.inputs?.find((i: any) => i.key === 'token')?.value ?? 'ETH',
    amount: inputValues['amount'] ?? d?.inputs?.find((i: any) => i.key === 'amount')?.value ?? 0.1,
  });

  if (!validated.success) {
    return nodeError(`Crypto Trade input invalid: ${validated.error.message}`);
  }

  let { action, token, amount } = validated.data as { action?: string; token?: string; amount?: number };

  // AI recommendation override
  const recommendation = inputValues['recommendation'] as any;
  if (recommendation) {
    if (recommendation.action) {
      action = recommendation.action.charAt(0).toUpperCase() + recommendation.action.slice(1).toLowerCase();
    }
    if (recommendation.token) token = recommendation.token;
    if (recommendation.amount !== undefined) {
      amount = typeof recommendation.amount === 'string'
        ? parseFloat(recommendation.amount)
        : recommendation.amount;
    }
  }

  action ??= 'Buy';
  token ??= 'ETH';
  amount ??= 0.1;

  const price = generateRandomPrice(token);
  const total = price * amount;
  const transactionId = generateRandomTxId(walletInfo.network ?? 'Ethereum');

  return nodeSuccess<CryptoTradeResult>(
    {
      transactionId,
      action,
      token,
      amount,
      price: price.toFixed(2),
      total,
      wallet: walletInfo.address,
      network: walletInfo.network ?? 'Ethereum',
      executedAt: new Date().toISOString(),
    },
    { startedAt: t0 }
  );
}
