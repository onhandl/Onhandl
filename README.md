# Onhandl

**AI-native visual workflow automation platform.** Build, deploy, and manage intelligent agents using a drag-and-drop canvas ; with first-class orchestrations and toolings.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, React Flow, TailwindCSS, Radix UI, Framer Motion |
| Backend | Fastify 4, Node.js, TypeScript |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (`@fastify/jwt`), session cookies |
| AI Providers | Google Gemini, OpenAI (+ proxy), Ollama (`qwen2.5:3b` default) |
| Blockchain | CKB L1 , Stellar, EVM|
| Monorepo | pnpm workspaces (`client/`, `server/`) |

---

## Quick Start (without Docker)

### Prerequisites
- Node.js v18+
- pnpm (`npm install -g pnpm`)
- MongoDB Atlas instance or local MongoDB

### 1. Install dependencies

```bash
git clone https://github.com/FadhilMulinya/Onhandl.git
cd Onhandl
pnpm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Minimum required values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string

DEFAULT_AI_PROVIDER=ollama   # or gemini / openai
GEMINI_API_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### 3. Start dev servers

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |

---

## Docker

Two compose files are included:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local dev — source mounted as volumes, hot-reload |
| `docker-compose.prod.yml` | Production (Contabo VPS) — compiled images, Nginx, onhandl.com domains |

### Local Dev

```bash
cp server/.env.example server/.env
# fill in server/.env

docker compose up --build
```

Source code is mounted as volumes — edit any file and it hot reloads automatically. No local Node.js install needed.

```bash
docker compose logs -f               # all services
docker compose logs -f server        # server only
docker compose down                  # stop
docker compose down -v               # stop + delete MongoDB volume
```

## Production (Contabo)

Domains: <br>
https://onhandl.com / https://www.onhandl.com → frontend <br>
https://api.onhandl.com → backend

#### 1. Fill in secrets

```bash
cp server/.env.example server/.env
```

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


#### 2. Deploy

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

```bash
docker compose -f docker-compose.prod.yml logs -f
 # rebuild one service
docker compose -f docker-compose.prod.yml up --build -d server
docker compose -f docker-compose.prod.yml logs --build client  
# shutdown docker services
docker compose -f docker-compose.prod.yml down
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `DEFAULT_AI_PROVIDER` | No | `ollama` (default), `gemini`, or `openai` |
| `GEMINI_API_KEY` | If using Gemini | Google AI Studio API key |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI / proxy API key |
| `OPENAI_BASE_URL` | If using proxy | e.g. `https://share-ai.ckbdev.com/v1` |
| `OPENAI_MODEL` | If using OpenAI | Model name, e.g. `gpt-4o` |
| `SMTP_HOST` | For OTP emails | `smtp.gmail.com` or `smtp.resend.com` |
| `SMTP_PORT` | For OTP emails | `587` |
| `SMTP_USER` | For OTP emails | SMTP username |
| `SMTP_PASS` | For OTP emails | SMTP password / app password |
| `STRIPE_SECRET_KEY` | Marketplace | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Marketplace | Stripe webhook signing secret |
| `STRIPE_CLIENT_ID` | Marketplace | Stripe Connect client ID |
| `FIBER_NODE_URL` | Blockchain | Fiber node RPC URL (default: `http://localhost:8227`) |
| `FIBER_AUTH_TOKEN` | Blockchain | Biscuit auth token for Fiber RPC |

> `ALLOWED_ORIGINS`, `APP_URL`, `API_URL`, and `STRIPE_REDIRECT_URI` are injected automatically by the compose files. Do not set them in `.env` unless overriding.

---

**Key patterns:**
- `AIFactory` — unified interface over Gemini, OpenAI, Ollama. Always use this, never call provider SDKs directly.
- `NodeOutput<T>` — every simulator returns a typed envelope (`result`, `status`, `confidence`, `metadata`).
- `FlowEngine` — traverses `AgentNode` / `AgentEdge` documents and executes nodes sequentially.
- `ToolSyncer` — registers tools into `ToolRegistry` at server startup.

---

## Features

- **Visual agent builder** — drag-and-drop React Flow canvas with auto-save
- **AI persona enhancement** — name + summary → full character schema (bio, traits, instructions)
- **Automated wallet provisioning** — each agent gets a dedicated configured chain wallet on creation
- **Workflow templates** — pre-built templates for common DeFi and automation tasks
- **Multi-provider AI** — Ollama (default), Gemini, OpenAI; configurable per-agent
- **Agent marketplace** — publish, discover, and purchase agents; creator revenue sharing via Stripe
- **nodes** — all registered tools available as first-class drag-and-drop nodes
- **A2A messaging** — agents can send structured messages to other registered agents
- **MCP server support** — expose agents as MCP-compatible tool servers
- **Gossip / bubble system** — real-time SSE-based agent event streaming
- **Community hub** — `/community` for posts, tutorials, and announcements
- **Support tickets** — built-in ticket system with admin dashboard
- **PWA export** — download any agent as a standalone Progressive Web App
