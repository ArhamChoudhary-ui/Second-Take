# Architecture

## Components

| Component | Responsibility | Source |
|---|---|---|
| Browser workspace | Conversation, change preview, approval, receipts, lab | `components/second-take/workspace.tsx` |
| Intent interpreter | Guided requests or Bedrock Converse to constrained intent | `lib/second-take/intent.ts` |
| MCP transport | Initialization, tool discovery, validated tool calls | `lib/second-take/mcp.ts` |
| Tool registry | Input schemas and domain dispatch | `lib/second-take/tools.ts` |
| Domain engine | Plans, execution, reconciliation, compensation, conflicts | `lib/second-take/engine.ts` |
| Persistent store | D1 reads and optimistic atomic updates | `lib/second-take/store.ts` |
| Browser action API | Explicit approval, manual edits, lab settings | `app/api/action/route.ts` |

## Request flow

1. `/api/state` opens a session with an opaque HttpOnly cookie and loads its database record.
2. `/api/command` interprets a request. It cannot create reservations.
3. The browser calls `/api/mcp` with `tools/call` for a preview.
4. The user reviews the exact plan, then approves through `/api/action`.
5. The browser calls `execute_approved_plan` through MCP.
6. Each action updates persistent state. The UI reloads state and displays confirmed or unresolved results.
7. Recovery uses the same approved operation and stable record IDs.

## Persistence and concurrency

`workspaces(id, data, version, updated_at)` stores a small, versioned JSON aggregate. Each demo session has its own inventory. A store transaction reads a snapshot, computes one deterministic change, then updates only where the old version still matches. A collision retries from a new snapshot, up to 12 attempts.

This provides atomic capacity accounting and reservation updates within a workspace. Each workflow step is a separate persisted transition, so the overall operation can remain partially completed. It is intentionally not a distributed transaction across external providers.

One aggregate keeps the prototype auditable and deployable. A production marketplace should move shared inventory and reservation identities into normalized tables with service-specific unique constraints, and introduce real external adapters. Do not describe this prototype as independently deployed microservices.

## Boundaries

Untrusted text is interpreted into an allowlisted intent. Zod validates tool arguments. Neither provider text nor browser-submitted flags can define SQL or compensation code. Tool annotations describe behavior; they do not authorize it.

The session cookie scopes all reads and writes. Hosted access is private by default. See SECURITY.md for limitations of the prototype's approval and authentication model.

## Deployment

Vinext builds a Cloudflare Worker and client assets. Sites provisions the declared D1 binding and applies checked-in Drizzle migrations. Local Wrangler uses a local database. The production archive contains build output, hosting configuration, and migrations, not secrets or development dependencies.

## Recovery stories and evidence

`components/second-take/workspace.tsx` is shared by `/` and `/demo`. The practice page includes `workspace=rehearsal` on API requests. The server derives a separate storage key from the same private session cookie; a client cannot select another user's key. The `start_rehearsal` action is rejected on the normal workspace and resets practice data only. Both areas use the same engine and real MCP calls. Rehearsals never bypass plan approval.

`operationEvidence` computes saved-record state, assistant status, attempts and preserved versions directly from the stored workspace. `get_operation` exposes this evidence to MCP clients. Counters are scoped to a booking, not hardcoded impact claims. The three sample services still share one database aggregate; these are not independently deployed provider APIs.

`exports.ts` generates escaped standalone HTML receipts and RFC 5545 calendar snapshots. No export makes an external calendar write. Preserved records are review-time snapshots, and the evidence indicates whether they remain unchanged at export time.

## General reservations

`service-conversation.ts` maintains a bounded multi-turn draft. `services.ts` manages restaurant, appointment and event reservations in optional fields of the existing workspace aggregate. A create/update/cancel plan is a single atomic persisted effect, distinct from the multi-action workshop engine. Opening an edit supersedes pending approvals, and an edit loads the current saved version. Execution validates the exact approved plan again. Timezone conversion rejects nonexistent or ambiguous local times and capacity checks overlapping slots across midnight.

The browser has a synchronous in-flight guard against overlapping button actions. This supplements, but does not replace, server idempotency and version checks. Calendar snapshots follow the relevant [iCalendar property rules](https://www.rfc-editor.org/info/rfc5545/) for UTC timestamps, stable UID, sequence, escaping and line folding. They are not scheduling messages or external calendar writes.
