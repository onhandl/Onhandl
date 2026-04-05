# FlawLess — Product Summary

---

## 1. Project Overview

**FlawLess** is an AI-native visual workflow automation platform that enables developers and non-technical users to build, deploy, and manage intelligent agents using a drag-and-drop sandbox interface. Agents are enriched with AI-generated personas, equipped with first-class CKB blockchain and Fiber Network tooling, and can be orchestrated to execute complex multi-step workflows entirely off-chain or anchored on-chain.

It sits at the intersection of AI orchestration and decentralised infrastructure, offering a unified interface to chain together LLM actions, blockchain operations, and conventional API calls — all within a single branded flow builder.

---

## 2. What Problem Does This Project Solve?

**Building blockchain-aware AI agents is hard.** Developers need to understand CKB's Cell Model, Fiber's multi-hop payment lifecycle, and how to wire these to LLM inference pipelines — across multiple disconnected tools and protocols.

FlawLess solves this by:

- **Abstracting Blockchain Complexity**: CKB RPC, cell indexing, transaction construction, Fiber channel lifecycle, and Biscuit authentication are pre-built as drag-and-droppable agent nodes with Zod-validated interfaces.
- **Democratising AI Agents**: Any user can define an agent with a simple persona summary and our AI auto-expands it into a rich character schema (bio, traits, system instructions).
- **Removing Infrastructure Boilerplate**: Auto-save, graph reconstruction, workspace isolation, and agent persistence are handled automatically — developers focus on logic, not plumbing.

---

## 3. System Design

### User Flow
1. User signs up → a Workspace is auto-provisioned.
2. From the Dashboard, user clicks **"Create Agent"** and inputs a Name + Persona summary.
3. Backend calls the default platform model or also user-selected model to expand the persona into a full `CharacterSchema` (bio, traits, instructions, description).
4. User is redirected to the **Sandbox** flow builder with a pre-seeded Character node.
5. User drags nodes from the Node Library and connects them visually.
6. All changes auto-save to our DB via debounced node/edge synchronisation.

### Agent Flow
```
[User Intent via Telegram/Webhook/Dashboard] 
  → [FlowEngine resolves Agent Graph & Execution Context] 
  → [Step-wise Execution via Tool Dispatcher] 
  → [External Integrations (AI / Blockchain / APIs)] 
  → [State Persistence & Real-time Event Streaming]
```


### Key UI Components
- **Dashboard** — Agent cards with AI-generated descriptions. Create / Edit modals with provider selection.
- **Sandbox** — React Flow canvas with drag-drop node library, live flow console, properties sidebar.
- **Node Library** — Hierarchical tooling nodes + generic input/output/processing nodes.
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
| AI Providers | Google Gemini (`@google/generative-ai`), Ollama (`qwen2.5:3B`), OpenAI SDK v6 |
| Monorepo | pnpm workspaces (client, server, tooling packages) |

### AI / Agent Stack
- **Agent Enhancer**: `AgentEnhancer.ts` — calls preferred model to generate character schemas from persona summaries.
- **Flow Engine**: `FlowEngine.ts` — orchestrates sequential execution of agent node graphs.
- **Provider Selection**: Users can override system API keys per-agent at creation time; keys are stored in browser `localStorage` per-provider slot.


  ### Environment Variables
```
GEMINI_API_KEY=
MONGO_URI=
JWT_SECRET=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
OLLAMA_BASE_URL=
OLLAMA_MODEL=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

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
| `blockchain.ckb.anchoring` | `anchor_data` | Write FlawLess run receipts / state into Cell data on-chain |

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
- Automated Wallet Provisioning: Each agent is automatically provisioned with a dedicated CKB wallet upon creation, enabling immediate participation in the Nervos ecosystem.
- Workflow Templates: Start from pre-built templates for common DeFi and automation tasks.
- Edit agents and re-enhance their character schema from an updated persona.
- Agents support a configurable `modelProvider` (Ollama(Default qwen2.5:3b)/Gemini / OpenAI / Anthropic) and custom API key overrides stored in browser session.
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
- Native Fiber Payment Rails: Agents can autonomously open/close Fiber channels and route micro-payments as part of their workflow logic.
- Security & Consent: Critical blockchain operations (like large transfers or channel settlements) require explicit user consent via the sandbox agent chat interaction, ensuring safety without sacrificing automation.
- Biscuit-based authentication for secure Fiber RPC endpoints.
- On-chain data anchoring for FlawLess state run receipts.

### Agent Marketplace & Creator Revenue
- Publish agents publicly to the FlawLess Marketplace for other users to discover and purchase.
- Agents can be listed with pricing; revenue flows to the creator via prefered  payment integration.
- **Creator Revenue Sharing**: Creators earn a percentage of every sale made through their published agents — building passive income from automation workflows they design.
- Revenue analytics dashboard showing earnings, sales history, and per-agent performance.

### Community & Blog
- Public Community hub at `/community` — a collaborative knowledge-sharing space open to all registered users.
- **FlawLess Official** posts: curated announcements, tutorials, and updates published by the FlawLess team.
- **Community** posts: any registered user can create and publish blog posts — share workflows, tips, agent use cases, and stories.
- Filter tabs to browse All, FlawLess Official, and Community posts independently.
- Full CMS at `/community/new`: title, rich body with character count, and tag management with add/remove controls.

### Support System
- Built-in support ticket system accessible from the dashboard sidebar.
- Users submit tickets with a subject and detailed message directly within the platform.
- Real-time status tracking: Open → In Progress → Resolved → Closed.
- Admin dashboard aggregates all tickets with the ability to update status and post admin notes/responses.
- Admin notes appear inline within the user's ticket view for seamless communication.

### UX & Dashboard
- Rich dashboard displaying all workspace agents with AI-generated descriptions.
- Plan badge prominently shown per user (Free / Starter / Pro / Max / Enterprise).
- Modals for agent creation and editing with provider & API key fields.
- Smooth animated transitions and premium UI with Radix UI + Framer Motion.
- Floating AI assistant widget available on all pages for quick queries without leaving context.

---

## 7. Future Functionality

- **Multi-Agent Orchestration**: Connect multiple agents as sub-agents within a parent workflow graph, enabling complex delegation trees.
- **FlawLess Runtime**: A lightweight headless execution runtime for deploying agent graphs to production without the sandbox UI.
- **Token-Gated Agents**: Integrate CKB cell ownership as agent access control — only wallets owning specific cells can invoke certain agents.
- **Multi-Chain Expansion**: Extend the blockchain tooling namespace to support EVM chains (Base, Ethereum) and Solana with the same drag-and-drop abstraction.
- **Telegram / Webhook Triggers**: Trigger agent executions directly from Telegram commands or inbound webhooks, enabling always-on bots.
- **Collaborative Workspaces**: Multi-member workspaces with role-based access, shared agents, and team execution history.
- **On-Chain Execution Receipts**: Automatically anchor agent run summaries (inputs, outputs, timestamps) into CKB Cell Data for auditability and verifiability.

---

## 8. Product Viability

**Yes — FlawLess has a clear path to becoming a viable product and infrastructure component.**

### As a Product
The core value proposition is a **low-code AI agent builder for blockchain developers**. This is currently an underserved segment: existing tools like n8n or Zapier have no native blockchain primitives, and CKB-specific developer tooling is largely code-only. FlawLess bridges this gap.

The AI-enhanced persona system makes agent creation accessible to non-expert users, while the typed CKB/Fiber tooling layer provides the rigour expert blockchain developers demand.

Monetisation paths include:
- **Hosted SaaS tiers** (Free, Starter, Pro, Max, Enterprise) — tiered token allowances, agent limits, and priority execution.
- **Creator Marketplace Revenue Share** — platform takes a percentage of agent sales; creators earn the rest via Stripe direct payouts.
- **Community-driven growth** — the blog/community hub drives organic discovery; Official posts keep users informed without external channels.
- **Support infrastructure** — built-in ticketing removes friction and keeps users within the platform ecosystem.
- **API Access** for organizations embedding the FlawLess Runtime in their own products.

### As Infrastructure
The `packages/tooling/blockchain` module is designed to be **modular and composable**. It can be published as a standalone npm package (`@FlawLess/ckb-tools`), allowing any AI agent framework (LangChain, AutoGen, etc.) to consume structured, validated CKB and Fiber tools without reinventing the wheel.

The `BlockchainTool<TInput, TOutput>` interface is MCP-compatible (Model Context Protocol), meaning these tools could be exposed as an MCP server — making them instantly usable across any AI coding assistant or agent runtime that supports the standard.

The combination of visual workflow authoring, first-class CKB/Fiber integration, and AI character expansion positions FlawLess as the **de-facto developer experience layer for the Nervos CKB ecosystem**.

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
git clone https://github.com/FadhilMulinya/FlawLess.git
cd FlawLess
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
Once running, sign up/log in to access the Dashboard. You can immediately begin creating AI-enhanced agents and building workflow graphs in the Sandbox!

---

## 10. Running with Docker (Recommended for Local Dev & Deployment)

Docker bundles the client, server, and a local MongoDB instance so you don't need to install Node.js or pnpm locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2 on Linux)

### 1. Configure environment variables

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
# Leave MONGO_URI blank — Docker Compose injects it automatically when using the local MongoDB container
MONGO_URI=

JWT_SECRET=your_secure_random_string

# AI providers (pick at least one)
DEFAULT_AI_PROVIDER=ollama        # or gemini / openai
GEMINI_API_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=

# Email / SMTP (for OTP verification emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

> **MongoDB Atlas instead of local Mongo?** Set your Atlas URI in `MONGO_URI` and comment out the `MONGO_URI` override line in `docker-compose.yml` under the `server` service.

### 2. Build and start all services

Run this from the **project root**:

```bash
docker compose up --build
```

First build takes a few minutes (downloads base images, installs deps, compiles TypeScript and Next.js). Subsequent starts are fast because Docker caches the layers.

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:3001        |
| MongoDB  | mongodb://localhost:27017    |

### 3. Run in the background (detached mode)

```bash
docker compose up --build -d
```

### 4. View logs

```bash
docker compose logs -f           # all services
docker compose logs -f server    # server only
docker compose logs -f client    # client only
```

### 5. Stop everything

```bash
docker compose down              # stop and remove containers
docker compose down -v           # also delete the MongoDB data volume
```

### 6. Rebuild a single service after code changes

```bash
docker compose build server      # rebuild server image
docker compose up -d server      # restart with new image
```

### Deploying to production

For production deployments (Railway, Render, Fly.io, VPS), set the `NEXT_PUBLIC_API_URL` build arg to your server's public URL so the client calls the right API:

```bash
# Build client pointing at your production API
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api \
  -f client/Dockerfile \
  -t omniflow-client \
  .

# Build server
docker build -f server/Dockerfile -t omniflow-server .
```

Then push both images to your container registry and deploy.

