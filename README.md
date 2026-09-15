# Second Take

**Preview, approve, and recover assistant bookings.**

A software-only Alexa+ experience simulation with MCP tools and persistent action history. It helps users change part of a booking, recover a lost confirmation without duplicates, and protect their own edits.

[Usage guide](docs/guides/USAGE.md) · [Architecture](docs/technical/ARCHITECTURE.md) · [Submission guide](docs/submission/README.md) · [MIT license](LICENSE)

## Features

- Workshop plans with camera rental and an in-app calendar event.
- Simulated restaurant, appointment and event reservations through conversation or forms.
- Exact approval before booking, changing or cancelling; editable previews and field comparisons.
- Three recovery stories: lost confirmation, a newer human edit, and partial cancellation.
- Saved evidence, HTML receipts and calendar snapshots.

**Prototype scope:** services are simulated; no real businesses are contacted. Conversation uses a guided parser. Calendar downloads do not synchronize automatically. The optional Bedrock adapter has not been verified with live AWS calls.

## Run locally

Requires Node.js 24 and pnpm 11.25.0. No API key is needed for guided mode.

```sh
git clone https://github.com/ArhamChoudhary-ui/Second-Take.git
cd Second-Take
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm db:local
corepack pnpm start -- --port 3000
```

Open **http://127.0.0.1:3000** for the workspace or **http://127.0.0.1:3000/demo** for recovery stories. Local Wrangler simulates the Worker and D1 database. Clearing browser cookies starts a separate workspace.

Try: **“Book a restaurant in Jaipur tomorrow at 7 pm for 2 people.”**

## Verify

```sh
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm verify:worker
```

The release suite contains 47 tests. Compiled Worker checks exercise the HTTP/MCP booking and recovery flows. GitHub Actions runs the verification workflow on pushes and pull requests. See the [test report](docs/technical/TEST_REPORT.md) for tested behavior and remaining gaps.

## Project structure

| Path | Contents |
|---|---|
| `app/` | Pages, API routes and global styles |
| `components/second-take/` | Workspace, reservation reviews and recovery stories |
| `components/ui/` | UI primitives used by the app |
| `lib/second-take/` | Booking logic, MCP, validation, parsing and exports |
| `db/`, `drizzle/` | Database schema, helpers and migrations |
| `scripts/` | Build, local setup, verification and source export |
| `tests/` | Domain, protocol and regression tests |
| `docs/guides/` | User walkthrough |
| `docs/technical/` | Architecture, protocol, security and test evidence |
| `docs/submission/` | Project description, video script and hackathon feedback |
| `public/` | Static assets |
| `build/`, `vendor/` | Required starter helpers and upstream license notices |

## Technical details

React, TypeScript, Vinext, Cloudflare Workers and D1. The browser calls ten MCP tools at `/api/mcp`, using Streamable HTTP and protocol version `2025-11-25`. Approval revisions, stable resource identities and optimistic version checks enforce the booking rules.

The hosted [prototype](https://second-take.kschoudhary43.chatgpt.site) currently requires owner access. Use the local setup above to run your own copy. The public source retains logical runtime bindings without the original private Site identity.

For optional server-side Bedrock configuration, see [.env.example](.env.example). Workshop interpretation can use that adapter; the other reservation flows remain guided. See [security boundaries](docs/technical/SECURITY.md) before connecting real providers.

## Documentation and license

[Documentation index](docs/README.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

MIT licensed. Existing dependency and starter notices are retained. [Build disclosure](docs/submission/BUILD_DISCLOSURE.md) describes recorded work, existing components and AI assistance.
