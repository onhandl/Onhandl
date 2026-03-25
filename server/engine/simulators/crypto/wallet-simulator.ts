import { generateRandomAddress, generateRandomBalance, getCurrencyForNetwork } from './helpers';

export function simulateCryptoWallet(data: any) {
    const outputs: Record<string, any> = {};

    const connectionType = data.inputs?.find((input: any) => input.key === 'connectionType')?.value || 'Wallet Address';
    const privateKey = data.inputs?.find((input: any) => input.key === 'privateKey')?.value || '';
    const walletAddress = data.inputs?.find((input: any) => input.key === 'walletAddress')?.value || '';
    const network = data.inputs?.find((input: any) => input.key === 'network')?.value || 'Ethereum';

    const canConnect = connectionType === 'Private Key' ? !!privateKey : !!walletAddress;

    if (canConnect) {
        const address = walletAddress || generateRandomAddress(network);
        const balance = generateRandomBalance(network);
        const currency = getCurrencyForNetwork(network);

        const walletInfo = {
            address,
            network,
            currency,
            connectionType,
            lastUpdated: new Date().toISOString(),
            connected: true,
        };

        outputs['connected'] = true;
        outputs['walletInfo'] = walletInfo;
        outputs['balance'] = balance;
    } else {
        outputs['connected'] = false;
        outputs['walletInfo'] = null;
        outputs['balance'] = 0;
    }

    return outputs;
}
