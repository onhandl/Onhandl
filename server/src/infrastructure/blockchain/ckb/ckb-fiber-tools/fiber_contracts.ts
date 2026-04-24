import { z } from "zod";

export type GenerateBiscuitInput = z.infer<typeof GenerateBiscuitSchema>;
export type OpenChannelInput = z.infer<typeof OpenChannelSchema>;
export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;
type ConnectPeerInput = z.infer<typeof ConnectPeerSchema>;
type DisconnectPeerInput = z.infer<typeof DisconnectPeerSchema>;
export type GetPaymentInput = z.infer<typeof GetPaymentSchema>;
export type PayInvoiceInput = z.infer<typeof PayInvoiceSchema>;
export type DecodeInvoiceInput = z.infer<typeof DecodeInvoiceSchema>;
export type ShutdownChannelInput = z.infer<typeof ShutdownChannelSchema>;
type AbandonChannelInput = z.infer<typeof AbandonChannelSchema>;


export const ShutdownChannelSchema = z.object({
    channel_id: z.string().describe("32-byte hex channel ID from list_channels"),
    close_address_args: z.string().describe("20-byte CKB lock arg (your address args). Found in your wallet address."),
    fee_rate: z.string().optional().describe("Shannons per KB, hex. Default 0x3FC = 1020 s/KB"),
});

export const AbandonChannelSchema = z.object({
    channel_id: z.string().describe("32-byte hex channel ID to abandon"),
});


export const GenerateBiscuitSchema = z.object({
    private_key_hex: z.string().startsWith("0x"),
    permissions: z.array(z.string()).optional().describe("Defaults to ['admin']"),
});

export const OpenChannelSchema = z.object({
    pubkey: z.string().min(1, "Peer pubkey is required (hex from list_peers → pubkey field)"),
    funding_amount: z.string().min(1, "Funding amount required. Enter CKB (e.g. '500') or hex shannons (e.g. '0xba43b7400'). Min ~62 CKB."),
    public: z.boolean().optional(),
});

export const GenerateInvoiceSchema = z.object({
    amount: z.string().optional().describe("Amount in shannons. E.g. '100000000' for 1 CKB. Omit for any-amount invoice."),
    currency: z.enum(["Fibb", "Fibt", "Fibd"]).optional()
        .describe("Fibt=Testnet, Fibb=Mainnet, Fibd=Devnet. Defaults to Fibt"),
    payment_hash: z.string().optional(),
    description: z.string().optional(),
    expiry: z.number().optional().describe("Defaults to 3600 seconds"),
});

export const ConnectPeerSchema = z.object({
    address: z.string().min(1, "Multiaddr is required. Format: /ip4/{IP}/tcp/{PORT}/p2p/{PEER_ID}"),
    save: z.boolean().optional(),
});

export const DisconnectPeerSchema = z.object({
    peer_id: z.string().min(1, "Peer ID required (Qm... format)"),
});

export const GetPaymentSchema = z.object({
    payment_hash: z.string(),
});

export const PayInvoiceSchema = z.object({
    invoice: z.string(),
    fee_limit: z.string().optional().describe("Maximum routing fee willing to pay. E.g. maximum shannons."),
    timeout: z.number().optional().describe("Defaults to 60 seconds"),
});

export const DecodeInvoiceSchema = z.object({
    invoice: z.string().startsWith("fib", "Fiber invoice must start with fibb, fibt, or fibd"),
    timeout: z.number().optional().describe("Timeout in seconds for the invoice lookup. Defaults to 60 seconds."),
});


export const ListChannelsSchema = z.object({
    peer_id: z.string().optional().describe("Filter by peer ID (Qm... format)"),
    pubkey: z.string().optional().describe("Filter by peer pubkey (hex)"),
    include_closed: z.boolean().optional().describe("Include closed channels"),
}).optional();