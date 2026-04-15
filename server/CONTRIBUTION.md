# Contributing Guide (Architecture Rules)

This section defines **how to extend the backend without breaking its architecture**.

If you don’t follow this, you will introduce coupling and degrade the system.

---

## How to Add a New Module

Every new feature must be added as a **module** inside:

```text
src/modules/[feature]/
```

### Required structure

```text
[feature]/
  [feature].controller.ts     → HTTP layer (thin)
  [feature].service.ts        → business logic
  [feature].repository.ts     → database access (if needed)
  [feature].validation.ts     → request validation (if public)
  index.ts                    → route registration
```

---

### Example

```text
src/modules/orders/
  order.controller.ts
  order.service.ts
  order.repository.ts
  order.validation.ts
  index.ts
```

---

### Route Registration

All routes must be registered through:

```text
src/api/routes/index.ts
```

Never register routes globally or inside random files.

---

## How to Add Business Logic

* Put logic inside **services**
* Keep controllers thin
* Do NOT access database directly in controllers

Correct:

```ts
controller → service → repository
```

Wrong:

```ts
controller → database (❌)
```

---

## How to Add Database Access

* Always use a **repository**
* Never call Mongoose/ORM directly from services or controllers

Correct:

```ts
service → repository → database
```

---

## How to Add Engine Logic

If the logic is:

* execution-related
* orchestration-related
* agent runtime behavior

Then it belongs in:

```text
src/core/
```

Core must remain:

* pure
* framework-agnostic
* independent of HTTP and DB

---

## How to Add Integrations

External systems go into:

```text
src/infrastructure/
```

Examples:

* AI providers
* blockchain clients
* messaging systems
* payment gateways

Rules:

* no HTTP logic
* no controllers
* expose clean interfaces

---

## How to Add SDK Features

* Export from `src/sdk/index.ts`
* Only expose:

  * services
  * core engine
  * stable contracts

Never expose:

* controllers
* route handlers
* HTTP-specific code

---

## How to Add Shared Utilities

Only add to `src/shared` if:

* it is reusable across multiple layers
* it has no dependency on higher-level modules

Do NOT turn `shared` into a dumping ground.

---

## Common Anti-Patterns (Do NOT do this)

### ❌ Calling DB inside controllers

```ts
// WRONG
const user = await UserModel.findById(id);
```

---

### ❌ Importing controllers into services

```ts
// WRONG
import { createUser } from '../user.controller';
```

---

### ❌ Core depending on infrastructure

```ts
// WRONG
import mongoose from 'mongoose';
```

---

### ❌ SDK importing API

```ts
// WRONG
import routes from '@/api/routes';
```

---

### ❌ Modules importing API

```ts
// WRONG
import { fastify } from '@/api/server';
```

---

## Adding a New Endpoint (Step-by-Step)

1. Add logic in `[feature].service.ts`
2. Add controller method in `[feature].controller.ts`
3. Add validation (if needed)
4. Register route in `[feature]/index.ts`
5. Register module in `src/api/routes/index.ts`

---

## Design Philosophy

This system is designed to:

* scale across multiple domains
* support both API and SDK usage
* isolate business logic from transport
* allow easy extension of agents, tools, and integrations

---

## Final Rule

> If you are unsure where something belongs, you are about to put it in the wrong place.

Stop and think before writing code.
