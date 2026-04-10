# Onhandl — Product Summary

---

## 1. Project Overview

**Onhandl** is an AI-native visual workflow automation platform that enables developers and non-technical users to build, deploy, and manage intelligent agents using a drag-and-drop sandbox interface. Agents are enriched with AI-generated personas, equipped with first-class CKB blockchain and Fiber Network tooling, and can be orchestrated to execute complex multi-step workflows entirely off-chain or anchored on-chain.

It sits at the intersection of AI orchestration and decentralised infrastructure, offering a unified interface to chain together LLM actions, blockchain operations, and conventional API calls — all within a single branded flow builder.

---

## 2. What Problem Does This Project Solve?

**Building blockchain-aware AI agents is hard.** Developers need to understand CKB's Cell Model, Fiber's multi-hop payment lifecycle, and how to wire these to LLM inference pipelines — across multiple disconnected tools and protocols.

Onhandl solves this by:

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
| `blockchain.ckb.anchoring` | `anchor_data` | Write Onhandl run receipts / state into Cell data on-chain |

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
- On-chain data anchoring for Onhandl state run receipts.

### Agent Marketplace & Creator Revenue
- Publish agents publicly to the Onhandl Marketplace for other users to discover and purchase.
- Agents can be listed with pricing; revenue flows to the creator via prefered  payment integration.
- **Creator Revenue Sharing**: Creators earn a percentage of every sale made through their published agents — building passive income from automation workflows they design.
- Revenue analytics dashboard showing earnings, sales history, and per-agent performance.

### Community & Blog
- Public Community hub at `/community` — a collaborative knowledge-sharing space open to all registered users.
- **Onhandl Official** posts: curated announcements, tutorials, and updates published by the Onhandl team.
- **Community** posts: any registered user can create and publish blog posts — share workflows, tips, agent use cases, and stories.
- Filter tabs to browse All, Onhandl Official, and Community posts independently.
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
- **Onhandl Runtime**: A lightweight headless execution runtime for deploying agent graphs to production without the sandbox UI.
- **Token-Gated Agents**: Integrate CKB cell ownership as agent access control — only wallets owning specific cells can invoke certain agents.
- **Multi-Chain Expansion**: Extend the blockchain tooling namespace to support EVM chains (Base, Ethereum) and Solana with the same drag-and-drop abstraction.
- **Telegram / Webhook Triggers**: Trigger agent executions directly from Telegram commands or inbound webhooks, enabling always-on bots.
- **Collaborative Workspaces**: Multi-member workspaces with role-based access, shared agents, and team execution history.
- **On-Chain Execution Receipts**: Automatically anchor agent run summaries (inputs, outputs, timestamps) into CKB Cell Data for auditability and verifiability.

---

## 8. Product Viability

**Yes — Onhandl has a clear path to becoming a viable product and infrastructure component.**

### As a Product
The core value proposition is a **low-code AI agent builder for blockchain developers**. This is currently an underserved segment: existing tools like n8n or Zapier have no native blockchain primitives, and CKB-specific developer tooling is largely code-only. Onhandl bridges this gap.

The AI-enhanced persona system makes agent creation accessible to non-expert users, while the typed CKB/Fiber tooling layer provides the rigour expert blockchain developers demand.

Monetisation paths include:
- **Hosted SaaS tiers** (Free, Starter, Pro, Max, Enterprise) — tiered token allowances, agent limits, and priority execution.
- **Creator Marketplace Revenue Share** — platform takes a percentage of agent sales; creators earn the rest via Stripe direct payouts.
- **Community-driven growth** — the blog/community hub drives organic discovery; Official posts keep users informed without external channels.
- **Support infrastructure** — built-in ticketing removes friction and keeps users within the platform ecosystem.
- **API Access** for organizations embedding the Onhandl Runtime in their own products.

### As Infrastructure
The `packages/tooling/blockchain` module is designed to be **modular and composable**. It can be published as a standalone npm package (`@Onhandl/ckb-tools`), allowing any AI agent framework (LangChain, AutoGen, etc.) to consume structured, validated CKB and Fiber tools without reinventing the wheel.

The `BlockchainTool<TInput, TOutput>` interface is MCP-compatible (Model Context Protocol), meaning these tools could be exposed as an MCP server — making them instantly usable across any AI coding assistant or agent runtime that supports the standard.

The combination of visual workflow authoring, first-class CKB/Fiber integration, and AI character expansion positions Onhandl as the **de-facto developer experience layer for the Nervos CKB ecosystem**.

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
git clone https://github.com/FadhilMulinya/Onhandl.git
cd Onhandl
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

## 10. Running with Docker

Two compose files ship with this repo:

| File | Purpose |
|---|---|
| `docker-compose.yml` | **Local dev** — source mounted as volumes, hot-reload, localhost URLs |
| `docker-compose.prod.yml` | **Production (Contabo)** — compiled images, Nginx, onhandl.com domains |

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2 on Linux)

---

### Local Development

#### 1. Configure environment variables

```bash
cp server/.env.example server/.env
```

Minimum values to set in `server/.env`:

```env
# Leave MONGO_URI blank — Compose injects it from the local MongoDB container
MONGO_URI=

JWT_SECRET=your_secure_random_string

DEFAULT_AI_PROVIDER=ollama        # or gemini / openai
GEMINI_API_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

> **MongoDB Atlas?** Set your Atlas URI in `MONGO_URI` and remove the `MONGO_URI` override under `server` in `docker-compose.yml`.

#### 2. Start all services (with hot-reload)

```bash
docker compose up --build
```

Source code is mounted into the containers — edit any file and the server/client reloads automatically. First build takes a few minutes; subsequent starts use cached layers.

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:3001 |
| MongoDB  | mongodb://localhost:27017 |

#### 3. Run in the background

```bash
docker compose up --build -d
```

#### 4. View logs

```bash
docker compose logs -f            # all services
docker compose logs -f server     # server only
docker compose logs -f client     # client only
```

#### 5. Stop everything

```bash
docker compose down               # stop containers
docker compose down -v            # also delete MongoDB volume
```

---

### Production Deployment (Contabo VPS)

The production stack runs fully compiled, non-root containers behind Nginx.
Domains: `onhandl.com`, `www.onhandl.com` (frontend) · `api.onhandl.com` (backend)

#### 1. Configure environment variables

```bash
cp server/.env.example server/.env
```

Fill in all production values. The compose file injects the URL env vars automatically — you only need secrets here:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/onhandl
JWT_SECRET=<strong-random-secret>

DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=<your-key>

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<resend-api-key>

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CLIENT_ID=ca_...
```

#### 2. Provision SSL certificates

Place your certificates at:
```
nginx/ssl/cert.pem
nginx/ssl/key.pem
```

**Using Certbot (Let's Encrypt):**
```bash
# Install certbot on the VPS
sudo apt install certbot

# Issue certificates (stop Nginx first if running)
sudo certbot certonly --standalone \
  -d onhandl.com -d www.onhandl.com -d api.onhandl.com

# Copy to the repo's nginx/ssl directory
sudo cp /etc/letsencrypt/live/onhandl.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/onhandl.com/privkey.pem   nginx/ssl/key.pem
```

#### 3. Point DNS records

| Record | Type | Value |
|--------|------|-------|
| `onhandl.com` | A | `<VPS IP>` |
| `www.onhandl.com` | A | `<VPS IP>` |
| `api.onhandl.com` | A | `<VPS IP>` |

#### 4. Deploy

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

This builds production images (compiled TypeScript, Next.js standalone), starts the Nginx reverse proxy, and applies `unless-stopped` restart policies.

#### 5. Useful commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild and restart a single service
docker compose -f docker-compose.prod.yml up --build -d server

# Stop everything
docker compose -f docker-compose.prod.yml down
```

---

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string (or blank for local Mongo via Compose) |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `DEFAULT_AI_PROVIDER` | No | `ollama` (default), `gemini`, or `openai` |
| `GEMINI_API_KEY` | If using Gemini | Google AI Studio API key |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI / proxy API key |
| `OPENAI_BASE_URL` | If using proxy | e.g. `https://share-ai.ckbdev.com/v1` |
| `OPENAI_MODEL` | If using OpenAI | Model name, e.g. `gpt-4o` |
| `SMTP_HOST` | For OTP emails | e.g. `smtp.gmail.com` or `smtp.resend.com` |
| `SMTP_PORT` | For OTP emails | `587` |
| `SMTP_USER` | For OTP emails | SMTP username |
| `SMTP_PASS` | For OTP emails | SMTP password / app password |
| `STRIPE_SECRET_KEY` | Marketplace | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Marketplace | Stripe webhook signing secret |
| `STRIPE_CLIENT_ID` | Marketplace | Stripe Connect client ID |
| `FIBER_NODE_URL` | Blockchain | Fiber node RPC URL (default: `http://localhost:8227`) |
| `FIBER_AUTH_TOKEN` | Blockchain | Biscuit auth token for Fiber RPC |

> URL variables (`ALLOWED_ORIGINS`, `APP_URL`, `API_URL`, `STRIPE_REDIRECT_URI`) are set automatically by the compose files — do not set them in `.env` unless overriding.

