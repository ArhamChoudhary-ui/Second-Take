# Second Take

**Review a booking. Approve the changes. Recover when something goes wrong.**

Second Take is a reservation workspace built around explicit approval and recoverable actions. It checks saved results before retrying interrupted requests and protects changes made by the user.

[Usage](docs/guides/usage.md) · [Development](docs/guides/development.md) · [Architecture](docs/technical/architecture.md) · [MCP reference](docs/technical/mcp.md)

## What it does

- Books workshop places, equipment, and a calendar event as one reviewed plan.
- Supports restaurant, appointment, and event reservation flows.
- Lets users change or cancel individual parts of a plan.
- Reconciles missing confirmations without duplicating completed actions.
- Keeps an activity record with downloadable receipts and calendar snapshots.

This is a software-only Alexa+ simulation. Providers are simulated, conversation uses a guided parser, and no real business is contacted.

## Run locally

Requires **Node.js 24** and **pnpm 11.25.0**. No API key is needed.

```sh
git clone https://github.com/ArhamChoudhary-ui/Second-Take.git
cd Second-Take
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm db:local
corepack pnpm start -- --port 3000
```

Open [localhost:3000](http://127.0.0.1:3000) and try:

> Book a restaurant in Jaipur tomorrow at 7 pm for 2 people.

Visit [/demo](http://127.0.0.1:3000/demo) to explore missing confirmations, protected user edits, and partial cancellations.

## Codebase

| Folder | Responsibility |
| --- | --- |
| [`src/`](src) | Application, components, booking logic, database schema and migrations |
| [`config/`](config) | Hosting, linting, and database configuration |
| [`tests/`](tests) | Unit tests, integration checks, and shared test helpers |
| [`tooling/`](tooling) | Build, runtime, setup, and release utilities |
| [`public/`](public) | Static assets |
| [`docs/`](docs) | Guides, technical references, and submission materials |

React and TypeScript run on Vinext, Cloudflare Workers, and D1. Booking tools use MCP Streamable HTTP. The `@/` alias points to `src/`.

## Verification

```sh
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm verify:worker
```

The suite covers approvals, duplicate prevention, recovery, conflicts, and session isolation. See the [test report](docs/technical/test-report.md) for coverage and remaining gaps.

## Project information

[Contributing](.github/CONTRIBUTING.md) · [Changelog](docs/changelog.md) · [Submission materials](docs/submission/README.md) · [Build provenance](docs/submission/build-disclosure.md)

Licensed under [MIT](LICENSE). Third-party notices are included with their source files.
