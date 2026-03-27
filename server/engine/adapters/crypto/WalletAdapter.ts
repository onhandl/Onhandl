import { z } from 'zod';
import { generateRandomAddress, generateRandomBalance, getCurrencyForNetwork } from '../../simulators/crypto/helpers';

// 1. Zod Schema
export const CryptoWalletInputSchema = z.object({
    connectionType: z.enum(['System', 'Private Key', 'Wallet Address']).default('Wallet Address'),
    network: z.string().default('ckb-testnet'),
    storageType: z.enum(['temporary', 'permanent']).default('temporary'),
    walletType: z.enum(['System', 'Externally Owned']).default('System'),
    privateKey: z.string().optional(),
    walletAddress: z.string().optional()
});

export type CryptoWalletInput = z.infer<typeof CryptoWalletInputSchema>;

export class CryptoWalletAdapter {
    static async execute(input: unknown, agent?: any) {
        // Validate with Zod
        const parsed = CryptoWalletInputSchema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Invalid wallet parameters: ${JSON.stringify(parsed.error.format())}`);
        }

        const data = parsed.data;
        const outputs: Record<string, any> = {};

        const isManagedOrPermanent = data.walletType === 'System' || data.storageType === 'permanent';

        // ... existing logic wrapped with schemas ...
        if (isManagedOrPermanent && agent?.blockchain) {
            const existing = agent.blockchain.find((b: any) => b.network === data.network);
            if (existing?.walletAddress) {
                const walletInfo = {
                    address: existing.walletAddress,
                    network: data.network,
                    currency: getCurrencyForNetwork(data.network),
                    connectionType: existing.walletType === 'managed' ? 'System' : 'MetaMask',
                    lastUpdated: new Date().toISOString(),
                    connected: true,
                };
                return { connected: true, walletInfo, balance: generateRandomBalance(data.network), outputData: walletInfo };
            }
        }

        const canConnect = data.connectionType === 'Private Key' ? !!data.privateKey : (data.connectionType === 'System' || !!data.walletAddress);

        if (canConnect) {
            const address = data.walletAddress || generateRandomAddress(data.network);
            const balance = generateRandomBalance(data.network);

            const walletInfo = {
                address,
                network: data.network,
                currency: getCurrencyForNetwork(data.network),
                connectionType: data.connectionType,
                lastUpdated: new Date().toISOString(),
                connected: true,
            };

            // If permanent, save
            if (data.storageType === 'permanent' && agent) {
                if (!agent.blockchain) agent.blockchain = [];
                const walletRecord = {
                    network: data.network,
                    walletAddress: address,
                    walletType: data.connectionType === 'System' ? 'managed' : 'externally_owned',
                    privateKey: data.privateKey || undefined
                };
                const existingIdx = agent.blockchain.findIndex((b: any) => b.network === data.network);
                if (existingIdx >= 0) agent.blockchain[existingIdx] = walletRecord;
                else agent.blockchain.push(walletRecord);

                await agent.save();
            }

            return { connected: true, walletInfo, balance, outputData: walletInfo };
        } else {
            return { connected: false, walletInfo: null, balance: 0, outputData: {} };
        }
    }
}
