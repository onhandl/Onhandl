import { GetBalanceTool } from "./ckb_get_balance";
import { TransferTool } from "./ckb_transfer";
import { BuildTransferTxTool } from "./ckb_tx_builder";
import { GetTipHeaderTool } from "./ckb_rpc_tip_header";
import { GetTransactionTool } from "./ckb_rpc_transaction";
import { GetBlockTool } from "./ckb_rpc_block";
import { GetLiveCellsByLockTool } from "./ckb_indexer_live_cells";
import { GetCapacityByLockTool } from "./ckb_indexer_capacity";
import { FindTransactionsTool } from "./ckb_indexer_find_transactions";
import { GetAllTransactionsTool } from "./ckb_indexer_get_transactions";
import { GetTotalReceivedTool } from "./ckb_indexer_total_received";
import { MonitorTransactionsTool } from "./ckb_indexer_monitor_transactions";
import { CreateSignatureTool } from "./ckb_create_signature";
import { VerifySignatureTool } from "./ckb_verify_signature";
import { GenerateWalletTool } from "./ckb_generate_wallet";
import { GetAddressTool } from "./ckb_get_address";

export * from "./ckb_get_balance";
export * from "./ckb_transfer";
export * from "./ckb_tx_builder";
export * from "./ckb_rpc_tip_header";
export * from "./ckb_rpc_transaction";
export * from "./ckb_rpc_block";
export * from "./ckb_indexer_live_cells";
export * from "./ckb_indexer_capacity";
export * from "./ckb_indexer_find_transactions";
export * from "./ckb_indexer_get_transactions";
export * from "./ckb_indexer_total_received";
export * from "./ckb_indexer_monitor_transactions";
export * from "./ckb_create_signature";
export * from "./ckb_verify_signature";
export * from "./ckb_generate_wallet";
export * from "./ckb_get_address";

export const getBalanceTools = [GetBalanceTool];

export const transferTools = [TransferTool];
export const txBuilderTools = [BuildTransferTxTool];
export const rpcTools = [
    GetTipHeaderTool,
    GetTransactionTool,
    GetBlockTool
];
export const indexerTools = [
    GetLiveCellsByLockTool,
    GetCapacityByLockTool,
    FindTransactionsTool,
    GetAllTransactionsTool,
    GetTotalReceivedTool,
    MonitorTransactionsTool,
];
export const signatureTools = [
    CreateSignatureTool,
    VerifySignatureTool
];
export const walletTools = [
    GenerateWalletTool,
    GetAddressTool
];
export const ckbContractsTools = [];