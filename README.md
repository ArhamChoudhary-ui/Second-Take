# Second Take

A booking assistant with explicit approval, selective cancellation, and recovery from interrupted requests.

Second Take lets users review a plan before it changes anything. If a confirmation is lost, it checks the saved result before retrying. If someone edits a reservation themselves, recovery preserves that edit or asks them to resolve the conflict.

Built with React, TypeScript, Vinext, Cloudflare Workers, and D1. The app exposes booking tools over MCP Streamable HTTP.

[Documentation](docs/README.md) · [Architecture](docs/technical/architecture.md) · [MCP reference](docs/technical/mcp.md)

## Capabilities

- Plan workshop places, equipment rental, and a calendar event together.
- Create, revise, and cancel simulated restaurant, appointment, and event reservations.
- Review individual changes and approve the exact revision before execution.
- Recover missing confirmations and partial cancellations without duplicating completed actions.
- Inspect action history and export receipts or calendar files.

## Getting started

Use **Node.js 24** and **pnpm 11.25.0**. Guided mode does not require API credentials.

```sh
git clone https://github.com/ArhamChoudhary-ui/Second-Take.git
cd Second-Take
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm db:local
corepack pnpm start -- --port 3000
```

Open [localhost:3000](http://127.0.0.1:3000). Try “Book a restaurant in Jaipur tomorrow at 7 pm for 2 people,” or open [/demo](http://127.0.0.1:3000/demo) for the recovery scenarios.

The local server uses Wrangler and a persistent local D1 database. Workspace identity is stored in a browser cookie. See the [usage guide](docs/guides/usage.md) for the booking and recovery flows.

## Development

Run commands from the repository root.

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev` | Start the development server |
| `corepack pnpm typecheck` | Check TypeScript |
| `corepack pnpm test` | Run domain and protocol tests |
| `corepack pnpm build` | Build the client and Worker |
| `corepack pnpm verify:worker` | Test compiled HTTP and MCP workflows |
| `corepack pnpm db:generate` | Generate a database migration |

## Repository layout

| Directory | Contents |
| --- | --- |
| [`src/`](src) | Pages, components, booking logic, database access, styles, and types |
| [`database/`](database) | Migration history and Drizzle configuration |
| [`tests/`](tests) | Unit tests, integration checks, and test helpers |
| [`tooling/`](tooling) | Build, runtime, dependency setup, database, and release utilities |
| [`public/`](public) | Static assets |
| [`docs/`](docs) | Usage, technical references, and submission materials |

The `@/` import alias resolves to `src/`. Framework configuration and package manifests remain at the root.

## Project status

This is an Alexa+ experience simulation. Booking providers are simulated; the app does not contact real businesses. Conversation uses a guided parser, and calendar exports are snapshots. The optional Bedrock adapter is not verified against live AWS services; configuration is described in [.env.example](.env.example).

The [hosted prototype](https://second-take.kschoudhary43.chatgpt.site) currently requires owner access. The local setup above runs independently. See the [test report](docs/technical/test-report.md) for coverage and known gaps, or the [submission materials](docs/submission/README.md) for the hackathon entry.

## Contributing

Read the [contribution guide](.github/CONTRIBUTING.md) before changing approval, recovery, or provider behavior. Release notes are in the [changelog](docs/changelog.md).

## License

[MIT](LICENSE). Third-party notices remain with their respective source files. See [build provenance](docs/submission/build-disclosure.md) for starter components and development attribution.
