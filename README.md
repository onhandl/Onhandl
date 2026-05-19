# Onhandl

Onhandl is organized as separate projects. The repository no longer uses Docker or a PNPM workspace.

## Projects

- `client` - Next.js frontend
- `server` - Fastify backend
- `ckb-contracts` - Rust smart contracts
- `terminal` - standalone CLI project

Each folder installs and manages its own dependencies.

## Local Setup

### Server

```bash
cd server
cp .env.example .env
pnpm install
pnpm dev
```

The API runs on `http://localhost:3001` by default. You need a MongoDB instance available through `MONGO_URI`.

### Client

```bash
cd client
pnpm install
pnpm dev
```

The frontend runs on `http://localhost:3000`.

### CKB Contracts

```bash
cd ckb-contracts
cargo build
cargo test
```

### Terminal

```bash
cd terminal
npm install
npm run dev
```

## Notes

- There is no Docker deployment config in this repository anymore.
- There is no root workspace install step anymore.
- Start each project from its own directory.
