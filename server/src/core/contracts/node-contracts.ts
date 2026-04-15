/**
 * Per-node typed I/O contracts.
 *
 * Each node type has:
 *   - An InputSchema  (Zod) — validated at runtime in FlowEngine before the simulator runs
 *   - A Result interface — the shape of NodeOutput<T>.result returned by the simulator
 *
 * Rules:
 *   - All inputs use .passthrough() so extra upstream keys are forwarded without error
 *   - All result interfaces are plain POJOs — no class instances, no circular refs
 */

import { z } from 'zod';

// ─── INPUT NODE ───────────────────────────────────────────────────────────────

export const InputNodeInputSchema = z.object({
  placeholder: z.string().optional(),
  label: z.string().optional(),
  required: z.boolean().optional(),
}).passthrough();

export interface InputNodeResult {
  value: string | number | boolean | Record<string, unknown>;
  inputType: 'text' | 'file' | 'webhook';
  label: string;
}

// ─── OUTPUT NODE ──────────────────────────────────────────────────────────────

const OutputNodeInputSchema = z.object({
  text: z.string().optional(),
  format: z.enum(['Plain', 'Markdown', 'HTML']).optional(),
}).passthrough();

export interface OutputNodeResult {
  displayText: string;
  format: 'Plain' | 'Markdown' | 'HTML';
  finalData: Record<string, unknown>;
}

// ─── ACTION: API CALL ─────────────────────────────────────────────────────────

export const ApiCallInputSchema = z.object({
  url: z.string().url('Must be a valid HTTP(S) URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
}).passthrough();

export interface ApiCallResult {
  response: unknown;
  statusCode: number;
  headers: Record<string, string>;
}

// ─── ACTION: AI PROCESSOR ────────────────────────────────────────────────────

export const AiProcessorInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
}).passthrough();

export interface AiProcessorResult {
  response: string;
  model: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
}

// ─── PROCESSING: AI TEXT ANALYZER / PROCESSORS ───────────────────────────────

export const ProcessingNodeInputSchema = z.object({
  text: z.string().optional(),
  data: z.unknown().optional(),
  transformation: z.string().optional(),
}).passthrough();

export interface FinancialProcessorResult {
  intent: string;
  message: string;
  amount?: number | string;
  address?: string;
  parameters: Record<string, unknown>;
}

export interface SocialProcessorResult {
  intent: string;
  tone: string;
  message: string;
  analysis: Record<string, unknown>;
}

export interface OperationalProcessorResult {
  intent: string;
  task: string;
  schedule: string;
  message: string;
  plan: Record<string, unknown>;
}

export interface GeneralProcessorResult {
  intent: string;
  message: string;
  raw: Record<string, unknown>;
}

export interface DataTransformerResult {
  transformed: unknown;
  inputType: string;
}

// ─── CONDITION NODE ───────────────────────────────────────────────────────────
// Branches are stored flat inside result so sourceHandle routing still works:
// edge.sourceHandle = 'true' → result['true']
// edge.sourceHandle = 'financialBranch' → result['financialBranch']

export interface ConditionNodeResult {
  conditionResult: boolean;
  matchedBranch?: string;
  [branchKey: string]: unknown;
}

// ─── BLOCKCHAIN NODE ──────────────────────────────────────────────────────────

export const BlockchainNodeInputSchema = z.object({
  network: z.enum(['CKB', 'Fiber', 'Ethereum', 'Base', 'Solana']).optional(),
  action_group: z.string().optional(),
  tool_lookup: z.string().optional(),
  payload: z.string().optional(),
}).passthrough();

export interface BlockchainNodeResult {
  data: unknown;
  network: string;
  toolName: string;
  txHash?: string;
}

// ─── CRYPTO WALLET ────────────────────────────────────────────────────────────

export const CryptoWalletInputSchema = z.object({
  connectionType: z.string().optional(),
  network: z.string().optional(),
  walletAddress: z.string().optional(),
  privateKey: z.string().optional(),
  storageType: z.enum(['temporary', 'permanent']).optional(),
}).passthrough();

export interface CryptoWalletResult {
  connected: boolean;
  address: string;
  network: string;
  currency: string;
  balance: number;
  connectionType: string;
  lastUpdated: string;
}

// ─── CRYPTO TRADE ─────────────────────────────────────────────────────────────

export const CryptoTradeInputSchema = z.object({
  walletInfo: z.unknown().optional(),
  action: z.enum(['Buy', 'Sell', 'Swap']).optional(),
  token: z.string().optional(),
  amount: z.number().optional(),
  targetToken: z.string().optional(),
  priceLimit: z.number().optional(),
}).passthrough();

export interface CryptoTradeResult {
  transactionId: string;
  action: string;
  token: string;
  amount: number;
  price: string;
  total: number;
  wallet: string;
  network: string;
  executedAt: string;
}

// ─── TELEGRAM NODE ────────────────────────────────────────────────────────────

export const TelegramInputSchema = z.object({
  chatId: z.union([z.string(), z.number()]),
  message: z.string().min(1, 'Message is required'),
}).passthrough();

export interface TelegramResult {
  messageId: number;
  chatId: string | number;
  sentAt: string;
}

// ─── A2A AGENT CALL NODE ──────────────────────────────────────────────────────

const A2ANodeInputSchema = z.object({
  recipientAgentId: z.string().min(1, 'Recipient agent ID is required'),
  performative: z
    .enum(['request', 'inform', 'confirm', 'refuse', 'query', 'propose'])
    .default('request'),
  content: z.string().min(1, 'Message content is required'),
  conversationId: z.string().optional(),
});

interface A2ANodeResult {
  messageId: string;
  recipientAgentId: string;
  performative: string;
  delivered: boolean;
  conversationId?: string;
  status: 'delivered' | 'failed';
}
