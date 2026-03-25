import { generateRandomTxId, generateRandomPrice } from './helpers';

export function simulateCryptoTrade(data: any, inputValues: Record<string, any>) {
    const outputs: Record<string, any> = {};
    let walletInfo = null;

    if (inputValues['walletInfo']) {
        walletInfo = inputValues['walletInfo'];
    } else if (data.inputs?.find((input: any) => input.key === 'walletInfo')?.value) {
        walletInfo = data.inputs.find((input: any) => input.key === 'walletInfo').value;
    }

    if (walletInfo && typeof walletInfo === 'object') {
        if (walletInfo.walletInfo) {
            walletInfo = walletInfo.walletInfo;
        } else if (!walletInfo.address && walletInfo.wallet) {
            walletInfo = {
                address: walletInfo.wallet,
                network: walletInfo.network || 'Ethereum',
                lastUpdated: walletInfo.timestamp || new Date().toISOString(),
            };
        }
    }

    const isWalletConnected = walletInfo && (walletInfo.connected === true || walletInfo.address);
    const recommendation = inputValues['recommendation'];

    let action = data.inputs?.find((input: any) => input.key === 'action')?.value || 'Buy';
    let token = data.inputs?.find((input: any) => input.key === 'token')?.value || 'ETH';
    let amount = data.inputs?.find((input: any) => input.key === 'amount')?.value || 0.1;

    if (recommendation) {
        if (recommendation.action) {
            action = recommendation.action.charAt(0).toUpperCase() + recommendation.action.slice(1).toLowerCase();
        }
        if (recommendation.token) token = recommendation.token;
        if (recommendation.amount) {
            amount = typeof recommendation.amount === 'string' ? Number.parseFloat(recommendation.amount) : recommendation.amount;
        }
    }

    if (isWalletConnected) {
        const transactionId = generateRandomTxId(walletInfo.network || 'Ethereum');
        const price = generateRandomPrice(token);
        const total = price * amount;

        outputs['status'] = 'completed';
        outputs['transactionId'] = transactionId;
        outputs['details'] = {
            action,
            token,
            amount,
            price: price.toFixed(2),
            total,
            timestamp: new Date().toISOString(),
            wallet: walletInfo.address,
            network: walletInfo.network || 'Ethereum',
        };
    } else {
        outputs['status'] = 'failed';
        outputs['error'] = 'No wallet connected. Please connect a wallet first.';
    }

    outputs['walletInfo'] = walletInfo;
    return outputs;
}
