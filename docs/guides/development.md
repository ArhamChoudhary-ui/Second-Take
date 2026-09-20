# Development

Follow the [local setup](../../README.md#run-locally) first. Run all commands from the repository root.

## Commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev` | Start the development server on port 5173 |
| `corepack pnpm typecheck` | Check application and tooling types |
| `corepack pnpm test` | Run unit tests for domain and protocol behavior |
| `corepack pnpm build` | Build the client and Worker |
| `corepack pnpm db:local` | Apply migrations to local D1 storage |
| `corepack pnpm start -- --port 3000` | Run the compiled app locally |
| `corepack pnpm verify:worker` | Test compiled HTTP/MCP flows in a disposable database |
| `corepack pnpm mcp:smoke` | Check MCP against a running local server |
| `corepack pnpm lint` | Run ESLint using `config/eslint.config.mjs` |
| `corepack pnpm db:generate` | Generate migrations using `config/drizzle.config.ts` |

## Source organization

Pages and routes live in `src/app/`. Shared UI primitives are in `src/components/ui/`; reservation screens are in `src/components/workspace/`. Booking logic, transport, validation, and recovery are in `src/lib/bookings/`.

Database schema, access helpers, and migration history are grouped in `src/server/database/`. Keep committed migration identities unchanged so existing databases can recognize applied migrations.

Build utilities live under `tooling/build/`, local environment helpers under `tooling/runtime/`, and dependency setup under `tooling/setup/`. Vite and TypeScript retain their root configuration entry points for framework discovery. CSS processing is configured in Vite.

## Local state and configuration

Wrangler stores local D1 data under `.wrangler/state/`. Browser cookies identify workspaces; clearing them starts a different workspace without deleting the old database record. Integration tests use disposable storage independently of the local app.

Guided mode runs without credentials. The optional Bedrock adapter accepts the server-side settings in [`.env.example`](../../.env.example); it has not been verified against live AWS services. Restaurant, appointment, and event requests remain guided. Calendar downloads are snapshots, not live synchronization.

The [hosted prototype](https://second-take.kschoudhary43.chatgpt.site) currently requires owner access. Use the local setup to run your own copy. Repository changes do not automatically redeploy that prototype.

For provider integrations, read the [architecture](../technical/architecture.md), [security boundaries](../technical/security.md), and [contribution guide](../../.github/CONTRIBUTING.md).
