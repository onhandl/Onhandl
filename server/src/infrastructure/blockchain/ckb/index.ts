import { BlockchainTool } from "../types";
import { rpcTools } from "./rpc";
import { indexerTools } from "./indexer";
import { txBuilderTools } from "./tx_builder";
import { anchoringTools } from "./anchoring";
import { agentTools } from "./agent_tools";

import { nodeAdminTools } from "./fiber/node_admin";
import { biscuitTools } from "./fiber/biscuit";
import { channelTools } from "./fiber/channel";
import { invoiceTools } from "./fiber/invoice";
import { paymentTools } from "./fiber/payment";

export const ckbTools: BlockchainTool<any, any>[] = [
    ...rpcTools,
    ...indexerTools,
    ...txBuilderTools,
    ...anchoringTools,
    ...agentTools
];

export const ckbFiberTools: BlockchainTool<any, any>[] = [
    ...nodeAdminTools,
    ...biscuitTools,
    ...channelTools,
    ...invoiceTools,
    ...paymentTools
];

const allCkbEcosystemTools = [
    ...ckbTools,
    ...ckbFiberTools
];
