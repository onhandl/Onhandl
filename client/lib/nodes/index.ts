import { baseNodes } from './base-nodes';
import { cryptoNodes } from './crypto-nodes';
import { socialNodes } from './social-nodes';
import { blockchainNodes } from './blockchain-nodes';
import { a2aNodes } from './a2a-nodes';

export const nodeDefinitions = [
    ...baseNodes,
    ...cryptoNodes,
    ...socialNodes,
    ...blockchainNodes,
    ...a2aNodes,
];

export { baseNodes, cryptoNodes, socialNodes, blockchainNodes, a2aNodes };
