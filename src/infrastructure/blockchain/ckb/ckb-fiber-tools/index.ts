import { GetNodeInfoTool } from "./fiber_node_info";
import { ConnectPeerTool } from "./fiber_connect_peer";
import { DisconnectPeerTool } from "./fiber_disconnect_peer";
import { ListPeersTool } from "./fiber_list_peers";
import { NetworkStatusTool } from "./fiber_network_status";
import { OpenChannelTool } from "./fiber_open_channel";
import { ListChannelsTool } from "./fiber_list_channels";
import { ShutdownChannelTool } from "./fiber_shutdown_channel";
import { AbandonChannelTool } from "./fiber_abandon_channel";
import { GenerateBiscuitTool } from "./fiber_generate_biscuit";
import { GenerateInvoiceTool } from "./fiber_generate_invoice";
import { PayInvoiceTool } from "./fiber_pay_invoice";
import { DecodeInvoiceTool } from "./fiber_decode_invoice";
import { GetPaymentTool } from "./fiber_get_payment";

export * from "./fiber_node_info";
export * from "./fiber_connect_peer";
export * from "./fiber_disconnect_peer";
export * from "./fiber_list_peers";
export * from "./fiber_network_status";
export * from "./fiber_open_channel";
export * from "./fiber_list_channels";
export * from "./fiber_shutdown_channel";
export * from "./fiber_abandon_channel";
export * from "./fiber_generate_biscuit";
export * from "./fiber_generate_invoice";
export * from "./fiber_pay_invoice";
export * from "./fiber_decode_invoice";
export * from "./fiber_get_payment";

export const nodeAdminTools = [
    GetNodeInfoTool,
    ConnectPeerTool,
    DisconnectPeerTool,
    ListPeersTool,
    NetworkStatusTool,
    GenerateBiscuitTool,
];

export const channelTools = [
    OpenChannelTool,
    ListChannelsTool,
    ShutdownChannelTool,
    AbandonChannelTool,
];

export const invoiceTools = [
    GenerateInvoiceTool,
    DecodeInvoiceTool,
    PayInvoiceTool,
    GetPaymentTool,
];


