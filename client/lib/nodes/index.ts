import { baseNodes } from './base-nodes';
import { cryptoNodes } from './crypto-nodes';
import { socialNodes } from './social-nodes';
import { blockchainNodes } from './blockchain-nodes';

export const nodeDefinitions = [
    ...baseNodes,
    ...cryptoNodes,
    ...socialNodes,
    ...blockchainNodes,
];

export { baseNodes, cryptoNodes, socialNodes, blockchainNodes };
