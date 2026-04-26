# API Handoff

## Scope

This document is the frontend handoff for the current server implementation.

It only includes APIs that are both:

1. Registered in the running Fastify app.
2. Backed by a real controller/service flow that the frontend can use today.

It intentionally does not include unfinished or non-exposed surfaces such as:

- Financial approval queue endpoints. The runtime can create approvals internally, but no HTTP controller exposes approval list/approve/reject routes yet.
- API-key-protected product routes. Developer API key management exists, but there is no concluded public route set currently protected by `authenticateApiKey`.
- Non-CKB payment-link execution flows. The payment area mentions more than one network in places, but the concluded payment-link flow is CKB only.

## Base Rules

- Base API URL: `/api`
- Auth for browser/app routes: HTTP-only cookie `auth_token`
- Frontend auth setting: always send `credentials: 'include'`
- Workspace-scoped routes: send `x-workspace-id`
- Terminal CLI auth token is for the terminal flow, not for normal browser sessions

Important:

- Some mounted routes have duplicate path segments because both the module prefix and controller path include the same word.
- Use the exact URLs documented below.
- The real paths include:
  - `/api/workspaces/workspaces`
  - `/api/support/support`
  - `/api/blog/blog`

## Recommended Frontend Boot Flow

1. Authenticate the user with login, register, verify-email, or password reset flow.
2. Call `GET /api/auth/me`.
3. Call `GET /api/workspaces/workspaces`.
4. Store the selected workspace ID.
5. Send `x-workspace-id` on all financial-agent and payment-link requests.

## Common Request Helper

```ts
const API_BASE = "/api";

export async function apiRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    workspaceId?: string;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, workspaceId, headers = {} } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}
```

## P0: Core Product APIs

These are the main endpoints for the current product.

### 1. Auth

| Method | Path | Auth | Purpose | Main Request Data |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | No | Start signup and send email OTP | `username`, `email`, `password`, optional `name` |
| POST | `/auth/verify-email` | No | Verify OTP and create session cookie | `email`, `code` |
| POST | `/auth/login` | No | Login and create session cookie | `username`, `password` |
| POST | `/auth/logout` | Cookie | Clear current session | None |
| POST | `/auth/forgot-password` | No | Send reset OTP if email exists | `email` |
| POST | `/auth/reset-password` | No | Reset password from OTP | `email`, `code`, `newPassword` |
| GET | `/auth/me` | Cookie or terminal token | Get current user profile | None |
| GET | `/auth/me/avatar` | Cookie | Get current avatar and display name | None |
| POST | `/auth/me` | Cookie | Update editable profile fields | `username`, `email`, `whatsapp`, `telegramUsername`, `avatarUrl` |

Frontend notes:

- `POST /auth/login` uses a field named `username`, but the backend service accepts either username or email in that field.
- `GET /auth/me` is the safest boot-time session check.
- After successful login or email verification, immediately fetch `/auth/me` and `/workspaces/workspaces`.

Example login:

```ts
await apiRequest("/auth/login", {
  method: "POST",
  body: {
    username: "fadhil",
    password: "secret123",
  },
});
```

### 2. Workspaces

| Method | Path | Auth | Purpose | Main Request Data |
| --- | --- | --- | --- | --- |
| GET | `/workspaces/workspaces` | Cookie | List current user workspaces | None |
| POST | `/workspaces/workspaces` | Cookie | Create a workspace | `name` |

Frontend notes:

- Use the returned workspace `_id` as the `x-workspace-id` header.
- The current backend behavior returns owner-owned workspaces only. Build around that current behavior.

Example:

```ts
const workspaces = await apiRequest("/workspaces/workspaces");
const activeWorkspaceId = workspaces[0]?._id;
```

### 3. Financial Agents

| Method | Path | Auth | Workspace Header | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/financial-agents/draft` | Cookie | Yes | Turn a rough natural-language idea into a structured draft |
| POST | `/financial-agents` | Cookie | Yes | Persist a structured financial agent |
| GET | `/financial-agents` | Cookie | Yes | List workspace financial agents |
| GET | `/financial-agents/:id` | Cookie | Yes | Get one financial agent and its runtime state |
| POST | `/financial-agents/:id/pause` | Cookie | Yes | Pause one agent |
| POST | `/financial-agents/:id/activate` | Cookie | Yes | Activate one agent |
| GET | `/financial-agents/events` | Cookie | Yes | Get recent financial events for the workspace |

#### Draft flow

Use this first:

```ts
const draft = await apiRequest("/financial-agents/draft", {
  method: "POST",
  workspaceId: activeWorkspaceId,
  body: {
    mode: "prompt",
    name: "Treasury Agent",
    prompt: "When funds are received on CKB, send 70 percent to treasury wallet and retain 30 percent.",
    preset: "balanced_allocator",
  },
});
```

#### Create flow

After the user reviews the returned draft:

```ts
const created = await apiRequest("/financial-agents", {
  method: "POST",
  workspaceId: activeWorkspaceId,
  body: {
    mode: "structured",
    draft,
  },
});
```

Frontend notes:

- This is the main product API surface.
- Treat `CKB` as the only concluded execution network.
- Treat transfer-and-retain automation as the concluded execution path.
- Do not present swap/invest execution as fully supported live behavior yet, even if draft validation mentions those action types.
- Use `/financial-agents/events` for activity views and timeline UIs.

### 4. Payment Links

| Method | Path | Auth | Workspace Header | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/payments/links/create` | Cookie | Yes | Create a payment link |
| GET | `/payments/links/list` | Cookie | Yes | List workspace payment links |
| GET | `/payments/links/details/:idOrCode` | Cookie | No | Get one payment link by DB id or encoded link |
| POST | `/payments/links/cancel/:idOrCode` | Cookie | No | Cancel a payment link |
| GET | `/payments/links/i/:code` | No | No | Public resolve for payment-link landing page |
| POST | `/payments/links/verify` | Cookie | No | Verify a payment by id/code in the body |
| POST | `/payments/links/verify/:idOrCode` | Cookie | No | Verify a payment by id/code in the path |

#### Supported network scope

- Concluded payment-link flow: `CKB`
- Build the UI around CKB only for live create-and-verify

#### Create payment link

Required CKB fields:

- `chain`
- `recipientAddress`
- `signerAddress`
- `signerSecret`
- `amount`
- `asset`

Optional fields:

- `memo`
- `reference`
- `expiresAt`
- `metadata`

Example:

```ts
const paymentLink = await apiRequest("/payments/links/create", {
  method: "POST",
  workspaceId: activeWorkspaceId,
  body: {
    chain: "CKB",
    recipientAddress: "ckb_receiver_address",
    signerAddress: "ckb_signer_address",
    signerSecret: "private_key_or_signing_secret",
    amount: "10",
    asset: "CKB",
    reference: "invoice-1001",
  },
});
```

#### Public payment page

Use the public endpoint to resolve a payment link:

```ts
const linkInfo = await apiRequest(`/payments/links/i/${encodedCode}`);
```

#### Verify payment

For CKB, the verification payload must include `txHash`.

Top-level verify:

```ts
await apiRequest("/payments/links/verify", {
  method: "POST",
  body: {
    id: paymentLinkIdOrCode,
    chain: "CKB",
    txHash: "0x...",
  },
});
```

Path-driven verify:

```ts
await apiRequest(`/payments/links/verify/${paymentLinkIdOrCode}`, {
  method: "POST",
  body: {
    txHash: "0x...",
  },
});
```

Frontend notes:

- Successful payment verification feeds the financial runtime.
- Use payment-link details plus financial-agent events to show downstream automation effects.

## P1: Product-Adjacent App APIs

These are important for the app, but secondary to the agent and payment flow.

### 5. Terminal Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/terminal/auth/start` | No | Start a device-code session |
| GET | `/terminal/auth/start` | No | Same as above for simpler clients |
| GET | `/terminal/auth/approve?userCode=...` | No | Redirect browser to frontend approval page |
| POST | `/terminal/auth/poll` | No | Poll CLI login status |
| POST | `/terminal/auth/logout` | No | Logout CLI session by device code |
| POST | `/terminal/auth/approve` | Cookie | Approve a pending CLI session |
| GET | `/terminal/auth/sessions` | Cookie | List active terminal sessions |
| DELETE | `/terminal/auth/sessions/:id` | Cookie | Revoke a terminal session |

Recommended frontend flow:

1. CLI calls `POST /terminal/auth/start`.
2. Backend returns `deviceCode`, `userCode`, `loginUrl`, `expiresIn`, `pollInterval`.
3. User opens the frontend page using the `userCode`.
4. Frontend ensures the user is logged in.
5. Frontend loads workspaces.
6. Frontend calls `POST /terminal/auth/approve` with `userCode` and `workspaceId`.
7. CLI keeps polling `POST /terminal/auth/poll` until approved.

Example approval:

```ts
await apiRequest("/terminal/auth/approve", {
  method: "POST",
  body: {
    userCode,
    workspaceId: activeWorkspaceId,
  },
});
```

Frontend notes:

- The terminal poll response returns the raw access token only once.
- The frontend should only handle approval UX and session management UX.

### 6. User Settings

#### Notifications

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/users/notifications` | Cookie | Get notification preferences |
| PUT | `/users/notifications` | Cookie | Update notification preferences |

#### Payment Methods

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/users/payment-methods` | Cookie | Get saved crypto payout methods |
| PUT | `/users/payment-methods` | Cookie | Update saved crypto payout methods |

#### AI Provider Keys

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/users/api-keys` | Cookie | Get masked provider key settings |
| PUT | `/users/api-keys` | Cookie | Save provider key settings |

Frontend notes:

- These are account-level settings, not workspace-level settings.
- The provider key response is masked on read.
- If you use `/ai/complete` or `/ai/stream` with `x-ai-api-key` from a separate origin, backend CORS may need adjustment first.

### 7. Developer API Key Management

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/developer/keys` | Cookie | List developer API keys |
| POST | `/developer/keys` | Cookie | Create a developer API key |
| DELETE | `/developer/keys/:id` | Cookie | Revoke a developer API key |

Frontend notes:

- These endpoints are concluded for key management UI.
- The raw secret is only returned once during creation.
- Current key prefix format is `onh_`.
- Do not assume there is already a concluded public SDK route set that consumes these keys.

## P2: Public, Support, and Utility APIs

### 8. Support

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/support/tickets` | Cookie | Create a support ticket |
| GET | `/support/support` | Cookie | List current user's support tickets |

### 9. Blog

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/blog/blog` | No | List published posts |
| GET | `/blog/blog/settings` | No | Get blog settings/config |
| GET | `/blog/blog/:id` | No | Get one blog post |
| POST | `/blog/blog` | Cookie | Create a blog post |
| PUT | `/blog/blog/:id` | Cookie | Update a blog post |
| DELETE | `/blog/blog/:id` | Cookie | Delete a blog post |

Frontend notes:

- Use the exact mounted `/blog/blog` paths.
- The write routes depend on backend authorization rules for authors/admins.

### 10. Bot and Messaging Utilities

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/bots/chat` | No | Chat with the assistant |
| POST | `/bots/telegram/webhook` | No | Telegram inbound webhook |
| GET | `/bots/telegram/webhook` | No | Telegram reachability check |
| POST | `/bots/telegram/test-connection` | No | Validate a Telegram bot token/chat id |

Frontend notes:

- `POST /bots/chat` is the concluded browser-friendly endpoint in this group.
- The webhook routes are mostly infrastructure endpoints.

### 11. AI Utility Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/ai/test-connection` | No | Test AI provider connectivity |
| POST | `/ai/complete` | No | Get a normal completion |
| POST | `/ai/stream` | No | Get a streaming completion over SSE |

Frontend notes:

- These are utility endpoints, not the main financial-agent product surface.
- `/ai/complete` and `/ai/stream` accept `x-ai-api-key` to override defaults.
- `/ai/stream` is POST-based SSE, so use `fetch` and stream parsing, not `EventSource`.

## P3: Admin-Only APIs

Only consume these if the frontend includes an admin panel.

### 12. Admin Users

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/users` | Admin cookie | List all users |
| DELETE | `/admin/users/:id` | Admin cookie | Delete a user |
| PATCH | `/admin/users/:id/admin` | Admin cookie | Toggle admin status |

### 13. Admin Agents and Executions

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/agents` | Admin cookie | List published agents |
| GET | `/admin/drafts` | Admin cookie | List draft agents |
| GET | `/admin/executions?page=1` | Admin cookie | List execution runs |

### 14. Admin Blog

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/blog` | Admin cookie | List all blog posts |
| DELETE | `/admin/blog/:id` | Admin cookie | Delete any blog post |
| POST | `/admin/blog/freeze` | Admin cookie | Freeze or unfreeze blog publishing |

### 15. Admin Support

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/support-tickets` | Admin cookie | List all support tickets |
| PATCH | `/admin/support-tickets/:id` | Admin cookie | Update ticket status and notes |

## Developer Reference Endpoints

These are useful during integration and QA.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/docs` | Scalar API docs UI |
| GET | `/openapi.json` | Raw OpenAPI spec |

## Not Included On Purpose

The following are intentionally excluded from frontend implementation planning for now:

- Financial approval HTTP APIs, because they are not exposed by a controller yet.
- `GET /api/payments/crypto/networks`, because its discovery response currently mixes concluded and unconcluded network capabilities.
- Non-CKB payment-link execution flows.
- Public route sets protected by developer API keys, because they are not concluded yet.
- Live swap/invest execution UX, because executor support is not concluded yet.

## Practical Frontend Priority

Build in this order:

1. Auth
2. Workspace selection
3. Financial agent draft/create/list/detail
4. Payment link create/public resolve/verify/list/detail
5. Terminal approval flow
6. User settings
7. Support
8. Blog and content
9. Utility AI and bot tools
10. Admin panel routes if needed
