import { BlockchainTool } from "../index";
import { rpcTools } from "./rpc";
import { indexerTools } from "./indexer";
import { txBuilderTools } from "./tx_builder";
import { anchoringTools } from "./anchoring";

import { nodeAdminTools } from "./fiber/node_admin";
import { biscuitTools } from "./fiber/biscuit";
import { channelTools } from "./fiber/channel";
import { invoiceTools } from "./fiber/invoice";
import { paymentTools } from "./fiber/payment";

export const ckbTools: BlockchainTool<any, any>[] = [
    ...rpcTools,
    ...indexerTools,
    ...txBuilderTools,
    ...anchoringTools
];

export const ckbFiberTools: BlockchainTool<any, any>[] = [
    ...nodeAdminTools,
    ...biscuitTools,
    ...channelTools,
    ...invoiceTools,
    ...paymentTools
];

export const allCkbEcosystemTools = [
    ...ckbTools,
    ...ckbFiberTools
];
