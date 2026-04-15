export function generateRandomAddress(network = 'Ethereum'): string {
    const chars = '0123456789abcdef';
    if (network.includes('ckb')) {
        // Mock CKB address format
        return 'ckt' + Array.from({ length: 42 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    let address = '0x';
    for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
}

export function generateRandomBalance(network = 'Ethereum'): number {
    return Math.floor(Math.random() * 50) + 1;
}

export function getCurrencyForNetwork(network = 'Ethereum'): string {
    switch (network) {
        case 'Ethereum': return 'ETH';
        case 'Polygon': return 'MATIC';
        case 'Solana': return 'SOL';
        case 'Bitcoin': return 'BTC';
        case 'ckb-mainnet':
        case 'ckb-testnet':
            return 'CKB';
        default: return 'ETH';
    }
}

export function generateRandomTxId(network = 'Ethereum'): string {
    const chars = '0123456789abcdef';
    let txId = '0x';
    for (let i = 0; i < 64; i++) {
        txId += chars[Math.floor(Math.random() * chars.length)];
    }
    return txId;
}

export function generateRandomPrice(token = 'ETH'): number {
    switch (token) {
        case 'ETH': return 2500 + Math.random() * 500;
        case 'BTC': return 65000 + Math.random() * 5000;
        case 'SOL': return 150 + Math.random() * 50;
        default: return 100 + Math.random() * 100;
    }
}
