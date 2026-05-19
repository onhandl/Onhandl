# Backend Architecture

This backend is built as an **agentic orchestration engine** that supports:

* multi-user / multi-workspace execution
* HTTP APIs (for apps & dashboards)
* SDK / programmatic usage (for developers and automation)

The system is structured to enforce **strict separation of concerns** and prevent architectural drift.

---

## High-Level Architecture

```text
core            → engine logic (pure, framework-agnostic)
modules         → business logic (features/domains)
infrastructure  → external integrations (DB, AI, blockchain, messaging)
api             → HTTP transport layer
sdk             → programmatic interface
shared          → low-level utilities, constants, types
workers         → background jobs / schedulers
```

---

## Layer Responsibilities

### `core/`

Contains the **execution engine and domain runtime**.

* FlowEngine
* orchestrators
* processors
* simulators
* contracts (interfaces)

Rules:

* pure logic only
* no HTTP
* no database
* no external integrations

---

### `modules/`

Contains **business features / domains**.

Examples:

* auth
* users
* agents
* executions
* payments
* marketplace

Each module follows:

```text
[module]/
  controller     → handles requests
  service        → business logic
  repository     → database access
  validation     → input validation
  index.ts       → route registration
```

---

### `infrastructure/`

Handles all **external systems and integrations**.

* database (Mongoose models, connection)
* AI providers (OpenAI, Ollama, Gemini)
* blockchain (CKB, etc.)
* messaging (email, Telegram, WhatsApp)
* event bus

Rules:

* no HTTP logic
* no controllers
* acts as adapters to external systems

---

### `api/`

The **transport layer**.

* Fastify setup
* route registration
* middleware
* external protocol integrations (e.g. MCP)

Rules:

* only layer allowed to handle HTTP concerns
* calls into `modules` services
* never used by `core`

---

### `sdk/`

Exposes the system as a **programmatic interface**.

* wraps core + selected services
* used for automation, agents, and external integrations

Rules:

* no HTTP dependencies
* no controllers
* only exports stable interfaces

---

### `shared/`

Low-level reusable utilities.

* constants
* types
* helpers
* config

Rules:

* must remain dependency-light
* must not depend on higher-level layers

---

### `workers/`

Background processing layer.

* job schedulers (e.g. Agenda)
* async execution tasks

---

## Architectural Rules (Enforced)

The following rules are enforced via ESLint:

* `core` imports only from `core` and `shared`
* `infrastructure` imports from `shared` and optionally `core/contracts`
* `modules` import from `core`, `infrastructure`, `shared`
* `modules` must NOT import from `api`
* `sdk` imports from `core`, selected `modules`, `shared`
* `sdk` must NOT import controllers or HTTP logic
* `api` imports from `modules`, never the other way around
* `shared` must remain isolated

Violations are treated as **architecture errors**, not style issues.

---

## Execution Flow

```text
HTTP Request
  ↓
Controller (api/modules)
  ↓
Service (business logic)
  ↓
Core Engine (FlowEngine, orchestration)
  ↓
Infrastructure (DB, AI, blockchain, messaging)
```

---

## Design Principles

* **Separation of concerns** over convenience
* **Feature modularity** over flat structure
* **Contracts over tight coupling** (especially in core)
* **Explicit boundaries** between layers
* **Scalability-first design** (SDK + API coexistence)

---

## Notes

* Controllers should remain thin (I/O only)
* Services contain business logic
* Repositories isolate database access
* Core must remain framework-agnostic
* SDK must remain transport-agnostic

---

## TL;DR

> core = logic
> modules = features
> infrastructure = integrations
> api = HTTP
> sdk = programmatic access
> shared = utilities

Maintain boundaries or the system will degrade.
