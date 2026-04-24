import { BlockchainTool } from "../types";

import {
    getBalanceTools,
    transferTools,
    walletTools,
    ckbContractsTools,
    txBuilderTools,
    rpcTools,
    indexerTools,
    signatureTools,
} from "./ckb-specific-tools";

import {
    nodeAdminTools,
    channelTools,
    invoiceTools,
} from "./ckb-fiber-tools";

// Re-export everything for a unified API
export * from "./ckb-specific-tools";
export * from "./ckb-fiber-tools";


export const ckbSpecificTools: BlockchainTool<any, any>[] = [
    ...rpcTools,
    ...indexerTools,
    ...txBuilderTools,
    ...getBalanceTools,
    ...transferTools,
    ...walletTools,
    ...ckbContractsTools,
    ...signatureTools
];

export const ckbFiberTools: BlockchainTool<any, any>[] = [
    ...nodeAdminTools,
    ...channelTools,
    ...invoiceTools,
];

const allCkbEcosystemTools = [
    ...ckbSpecificTools,
    ...ckbFiberTools
];
