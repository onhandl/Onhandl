# Omniflow — Product Summary

---

## 1. Project Overview

**Omniflow** is an AI-native visual workflow automation platform that enables developers and non-technical users to build, deploy, and manage intelligent agents using a drag-and-drop sandbox interface. Agents are enriched with AI-generated personas, equipped with first-class CKB blockchain and Fiber Network tooling, and can be orchestrated to execute complex multi-step workflows entirely off-chain or anchored on-chain.

It sits at the intersection of AI orchestration and decentralised infrastructure, offering a unified interface to chain together LLM actions, blockchain operations, and conventional API calls — all within a single branded flow builder.

---

## 2. What Problem Does This Project Solve?

**Building blockchain-aware AI agents is hard.** Developers need to understand CKB's Cell Model, Fiber's multi-hop payment lifecycle, and how to wire these to LLM inference pipelines — across multiple disconnected tools and protocols.

Omniflow solves this by:

- **Abstracting Blockchain Complexity**: CKB RPC, cell indexing, transaction construction, Fiber channel lifecycle, and Biscuit authentication are pre-built as drag-and-droppable agent nodes with Zod-validated interfaces.
- **Democratising AI Agents**: Any user can define an agent with a simple persona summary and our AI auto-expands it into a rich character schema (bio, traits, system instructions).
- **Removing Infrastructure Boilerplate**: Auto-save, graph reconstruction, workspace isolation, and agent persistence are handled automatically — developers focus on logic, not plumbing.

---

## 3. System Design

### User Flow
1. User signs up → a Workspace is auto-provisioned.
2. From the Dashboard, user clicks **"Create Agent"** and inputs a Name + Persona summary.
3. Backend calls AI (Gemini or OpenAI) to expand the persona into a full `CharacterSchema` (bio, traits, instructions, description).
4. User is redirected to the **Sandbox** flow builder with a pre-seeded Character node.
5. User drags CKB/Fiber/AI nodes from the Node Library and connects them visually.
6. All changes auto-save to MongoDB via debounced node/edge synchronisation.

### Agent Flow
```
[User Intent via Telegram/Webhook/Dashboard] 
  → [FlowEngine loads agent graph from AgentNode + AgentEdge collections] 
  → [Executes nodes sequentially with tool dispatch] 
  → [CKB tools → CKB Testnet RPC] 
  → [Fiber tools → Fiber Node RPC] 
  → [AI tools → LLM provider API] 
  → [Console output streamed back to Sandbox UI]
```

### Key UI Components
- **Dashboard** — Agent cards with AI-generated descriptions. Create / Edit modals with provider selection.
- **Sandbox** — React Flow canvas with drag-drop node library, live flow console, properties sidebar.
- **Node Library** — Hierarchical CKB/Fiber tooling nodes + generic input/output/processing nodes.
- **Flow Console** — Real-time execution log viewer docked at the bottom of the sandbox.

### Backend Architecture
- **Runtime**: Fastify on Node.js with TypeScript.
- **Database**: MongoDB Atlas — separate collections for `AgentDefinition`, `AgentNode`, `AgentEdge`, `ToolRegistry`, `Workspace`, `User`.
- **AI Abstraction Layer**: `AIFactory` pattern supporting Gemini, OpenAI (+ proxy), and Anthropic as named providers.
- **Blockchain Tooling Namespace**: Modular `BlockchainTool<TInput, TOutput>` typed interfaces registered into `ToolRegistry`.

---

## 4. Setup Environment

### Local Stack
| Component | Technology |
|---|---|
| Frontend | Next.js 15, React 19, React Flow, TailwindCSS (Radix UI), Framer Motion |
| Backend | Fastify 4, Node.js, TypeScript, tsx (watch mode) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT via `@fastify/jwt`, session cookies |
| AI Providers | Google Gemini (`@google/generative-ai`), OpenAI SDK v6 |
| Monorepo | pnpm workspaces (client, server, tooling packages) |

### AI / Agent Stack
- **Agent Enhancer**: `AgentEnhancer.ts` — calls Gemini or OpenAI (via shared proxy `share-ai.ckbdev.com`) to generate character schemas from persona summaries.
- **Flow Engine**: `FlowEngine.ts` — orchestrates sequential execution of agent node graphs.
- **Provider Selection**: Users can override system API keys per-agent at creation time; keys are stored in browser `localStorage` per-provider slot.

### Environment Variables
```
GEMINI_API_KEY=...
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://share-ai.ckbdev.com/v1
OPENAI_MODEL=gpt-5.4
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
CKB_NODE_URL=http://localhost:8114
CKB_INDEXER_URL=http://localhost:8116
FIBER_NODE_URL=http://localhost:8227
```

---

## 5. Tooling

### CKB On-Chain Elements

| Module | Tool | Description |
|---|---|---|
| `blockchain.ckb.rpc` | `get_tip_header` | Fetch the latest chain header |
| `blockchain.ckb.rpc` | `get_transaction` | Resolve a tx by 32-byte hash |
| `blockchain.ckb.rpc` | `get_block` | Fetch a block by hash |
| `blockchain.ckb.indexer` | `get_live_cells_by_lock` | Query live cells by lock script |
| `blockchain.ckb.indexer` | `get_capacity_by_lock` | Aggregate CKB balance for an address |
| `blockchain.ckb.tx_builder` | `build_transfer_tx` | Deterministically build a CKB transfer transaction |
| `blockchain.ckb.anchoring` | `anchor_data` | Write Omniflow run receipts / state into Cell data on-chain |

### Fiber Network Tooling

| Module | Tool | Description |
|---|---|---|
| `blockchain.ckb_fiber.channel` | `open_channel` | Open a payment channel with a peer |
| `blockchain.ckb_fiber.channel` | `close_channel` | Cooperatively settle a channel on-chain |
| `blockchain.ckb_fiber.channel` | `list_channels` | List all active channels |
| `blockchain.ckb_fiber.invoice` | `generate_invoice` | Create a Fiber invoice for payment |
| `blockchain.ckb_fiber.invoice` | `decode_invoice` | Decode a Fiber invoice to view metadata |
| `blockchain.ckb_fiber.payment` | `pay_invoice` | Initiate a multi-hop off-chain payment |
| `blockchain.ckb_fiber.payment` | `payment_status` | Track in-flight payment status |
| `blockchain.ckb_fiber.biscuit` | `mint_token` | Generate a Biscuit auth token for RPC access |
| `blockchain.ckb_fiber.biscuit` | `revoke_token` | Revoke an issued Biscuit token |
| `blockchain.ckb_fiber.node_admin` | `node_info` | Retrieve Fiber node identity and peer list |
| `blockchain.ckb_fiber.node_admin` | `network_status` | Get connected network channels and liquidity |

### Infrastructure Used
- **`@nervosnetwork/ckb-sdk-core`** — CKB JSON-RPC client for all Layer 1 interactions.
- **`@ckb-lumos/lumos`** — Cell indexer queries and lock script utilities.
- **`@ckb-ccc/shell`** — CKB transaction signing abstractions.
- **Fiber node (local)** — Self-hosted Fiber node interacted with via HTTP JSON-RPC (per `fiber-lib` spec).
- **Biscuit Auth** — Token-based access control for Fiber RPC endpoints.

---

## 6. Current Functionality

### Agent Management
- Create agents with AI-enhanced personas (name + summary → full character schema with bio, traits, system instructions, and dashboard description).
- Edit agents and re-enhance their character schema from an updated persona.
- Agents support a configurable `modelProvider` (Gemini / OpenAI / Anthropic) and custom API key overrides stored in browser session.
- Public transparency endpoint: `GET /api/agents/:id.json` exposes the stored character JSON.

The agent id is accessible via the url immediately after creation.

it will look like this http://localhost:3000/sandbox?agentId=69c4e884596fa8e3e3ca4176

  ***After an agent has been create you can view the detailed character schema at http://localhost:3001/api/agents/:id.json***

  ***example http://localhost:3001/api/agents/69c4e884596fa8e3e3ca4176.json***

### Sandbox Flow Builder
- Drag-and-drop visual canvas powered by React Flow.
- Hierarchical Node Library with all CKB, Fiber, and generic processing/output nodes.
- Auto-save: All node and edge mutations are debounced and persisted atomically to MongoDB.
- Flow Console: Real-time execution log overlay visible inside the sandbox.
- Character starting node is auto-seeded when a new agent is created.

### Blockchain Integration
- CKB RPC tools for reading chain state (header, blocks, transactions).
- CKB Indexer tools for live cell queries and capacity lookups.
- Transaction builder for creating unsigned CKB transfers.
- Fiber channel open/close lifecycle with on-chain settlement.
- Fiber off-chain payments via multi-hop invoice routing.
- Biscuit-based authentication for secure Fiber RPC endpoints.
- On-chain data anchoring for Omniflow state run receipts.

### UX & Dashboard
- Rich dashboard displaying all workspace agents with AI-generated descriptions.
- Modals for agent creation and editing with provider & API key fields.
- Smooth animated transitions and premium UI with Radix UI + Framer Motion.

---

## 7. Future Functionality

- **Multi-Agent Orchestration**: Connect multiple agents as sub-agents within a parent workflow graph, enabling complex delegation trees.
- **Workflow Templates**: Pre-built workflow packs (e.g., "DeFi Portfolio Monitor", "Fiber Liquidity Manager", "On-chain Activity Notifier") distributable as one-click templates.
- **Omniflow Runtime**: A lightweight headless execution runtime for deploying agent graphs to production without the sandbox UI.
- **Token-Gated Agents**: Integrate CKB cell ownership as agent access control — only wallets owning specific cells can invoke certain agents.
- **Multi-Chain Expansion**: Extend the blockchain tooling namespace to support EVM chains (Base, Ethereum) and Solana with the same drag-and-drop abstraction.
- **Telegram / Webhook Triggers**: Trigger agent executions directly from Telegram commands or inbound webhooks, enabling always-on bots.
- **Collaborative Workspaces**: Multi-member workspaces with role-based access, shared agents, and team execution history.
- **Agent Marketplace**: A curated directory where developers can publish and monetise agent workflows as reusable Omniflow packages.
- **On-Chain Execution Receipts**: Automatically anchor agent run summaries (inputs, outputs, timestamps) into CKB Cell Data for auditability and verifiability.
- **Native Fiber Payment Rails Inside Agents**: Allow agents to autonomously open/close Fiber channels and route micro-payments as part of a workflow logic step.

---

## 8. Product Viability

**Yes — Omniflow has a clear path to becoming a viable product and infrastructure component.**

### As a Product
The core value proposition is a **low-code AI agent builder for blockchain developers**. This is currently an underserved segment: existing tools like n8n or Zapier have no native blockchain primitives, and CKB-specific developer tooling is largely code-only. Omniflow bridges this gap.

The AI-enhanced persona system makes agent creation accessible to non-expert users, while the typed CKB/Fiber tooling layer provides the rigour expert blockchain developers demand.

Monetisation paths include:
- **Hosted SaaS tiers** (free for personal use, pay-per-seat for teams).
- **Premium Templates + Marketplace** (revenue share with template creators).
- **API Access** for organizations embedding the Omniflow Runtime in their own products.

### As Infrastructure
The `packages/tooling/blockchain` module is designed to be **modular and composable**. It can be published as a standalone npm package (`@omniflow/ckb-tools`), allowing any AI agent framework (LangChain, AutoGen, etc.) to consume structured, validated CKB and Fiber tools without reinventing the wheel.

The `BlockchainTool<TInput, TOutput>` interface is MCP-compatible (Model Context Protocol), meaning these tools could be exposed as an MCP server — making them instantly usable across any AI coding assistant or agent runtime that supports the standard.

The combination of visual workflow authoring, first-class CKB/Fiber integration, and AI character expansion positions Omniflow as the **de-facto developer experience layer for the Nervos CKB ecosystem**.

---

## 9. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: pnpm (`npm install -g pnpm`)
- **Database**: MongoDB Atlas instance or local MongoDB
- **AI Keys**: Google Gemini API Key and/or OpenAI API Key (or shared proxy)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/FadhilMulinya/Omniflow.git
cd Omniflow
pnpm install
```

### Configuration

1. Locate the **server** directory and create a `.env` file based on `.env.example`:
   ```bash
   cp server/.env.example server/.env
   ```
2. Open `server/.env` and update the following values:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string for token signing.
   - `GEMINI_API_KEY`: Your Google AI Studio key.
   - `OPENAI_API_KEY`: Your OpenAI key (or proxy key).
   - `OPENAI_BASE_URL`: (Optional) Set to `https://share-ai.ckbdev.com/v1` for proxy usage.

3. (Optional) Repeat the process for the `client` directory if specific frontend environment variables are required.

### Running the System

To start both the backend server and the frontend application in development mode:Run this in the root folder

```bash
pnpm dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### Workspace Verification
Once running, sign up/log in to access the Dashboard. You can immediately begin creating AI-enhanced agents and building CKB workflow graphs in the Sandbox!

