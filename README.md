# Second Take

[Source](https://github.com/ArhamChoudhary-ui/Second-Take) · [Submission guide](docs/SUBMIT_START_HERE.md) · [Architecture](docs/ARCHITECTURE.md) · [MIT](LICENSE)

**Change your mind. Keep control.** · [MIT license](LICENSE)

**Submitting this project? Start with [the submission pack](docs/SUBMIT_START_HERE.md).**

A software-only Alexa+ experience simulation for the Amazon Developer Hackathon. Preview a community-studio booking, approve real saved changes, correct part of the request, and recover from a lost service response without duplicating a reservation.

**Status: 0.2.0 hackathon prototype.** The live Bedrock adapter is implemented but not configured or exercised against AWS. This is not a production Alexa integration or a universal undo system.

## Try it

**Start with [the recovery stories](https://second-take.kschoudhary43.chatgpt.site/demo)** if you have access to the current owner-private prototype, or open `/demo` on your local server.

1. Start **The missing confirmation**. Preview and approve its three actions.
2. Compare the service’s saved camera record with the assistant’s missing confirmation.
3. Click **Check & resume**. The existing camera is found; the calendar completes without a duplicate.
4. Start **The edit that stays yours**. Book, edit the calendar, remove the camera, and preserve your own edit.
5. Try **The unfinished cancellation** to resume just the failed cancellation.
6. Export a readable HTML receipt or a labelled `.ics` demo calendar event.

These examples use a separate saved practice workspace. Starting or restarting them does not clear your normal workspace. For free exploration, return to `/` and choose **What can I ask?**, type a supported request, or use the booking controls.

All inventory belongs to this browser's isolated demo workspace. It is saved on the server and survives refreshes. Clearing cookies starts another workspace. There are no payments or external calendar writes. Calendar exports are snapshots, not live synchronization; later edits and cancellations do not update an imported file automatically.

## Run locally

Requirements: Node.js 24 LTS (recommended for the built-in SQLite test adapter), Git, and the pnpm version pinned in `package.json`. Internet access is needed for the initial dependency installation.

```sh
git clone https://github.com/ArhamChoudhary-ui/Second-Take.git
cd Second-Take
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm db:local
corepack pnpm start -- --port 3000
```

Open `http://127.0.0.1:3000`. The build is a Cloudflare-compatible Worker; local Wrangler simulates D1. `db:local` tracks applied migrations and is safe to rerun. Do not manually replay an applied SQL file. You can use `pnpm dev` after database setup for development; check the URL printed by the server.

The repository includes host build helpers. On a fresh local machine, the execution-profile helper automatically selects the portable profile when the managed runtime is absent. The public source includes only logical runtime bindings in `.openai/hosting.json`. The original private Site identity has been removed. Hosting your own copy requires provisioning its own Worker/D1 resources.

### Verify

```sh
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
corepack pnpm verify:worker
# With the local server above running:
SECOND_TAKE_URL=http://127.0.0.1:3000 corepack pnpm mcp:smoke
```

`test` exercises the domain engine with real SQLite persistence and the MCP request handler. `verify:worker` exercises compiled API routes with a disposable Miniflare D1 database. No user data is modified by these test suites.

## Architecture

- React 19 interface using the existing Vinext/Cloudflare starter and accessible Radix-backed controls.
- `/api/mcp`: stateless MCP Streamable HTTP, protocol `2025-11-25`, JSON responses.
- D1 persistence behind a small compare-and-swap store interface.
- Explicit action states, stable reservation identifiers, version checks, and compensating actions.
- A deterministic guided interpreter, plus a configurable Bedrock Converse adapter.
- Browser approvals bound to immutable plan IDs and revisions.

The MCP transport is a small direct implementation of the documented protocol. The official SDK could not be installed from the restricted build environment, so we do **not** claim SDK-based implementation or independent SDK interoperability certification. Both the UI and tests call the protocol endpoint. See [MCP.md](docs/MCP.md).

## Live AI / AWS

Guided mode is the default and is labeled in the UI. For Bedrock, supply all three values from `.env.example` as server-side environment values. In local Wrangler development, use an ignored `.dev.vars` file. Use a Bedrock API key and a Converse-capable model available in your account. Do not paste secrets into the repository or client-side variables.

When configured, Bedrock interprets supported workshop requests into a validated intent. Restaurant, appointment and event requests use the guided parser. The deterministic engine still checks capacity, approvals, ownership, versions, and action preconditions. Missing credentials select guided mode; provider errors do not silently claim success. Actual AWS integration testing remains a submission task.

## Documentation

- [Start here: walkthrough and presenter explanation](docs/START_HERE.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)
- [Product and acceptance criteria](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Recovery model](docs/RECOVERY_MODEL.md)
- [MCP and tool contracts](docs/MCP.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Devpost draft](docs/DEVPOST_DRAFT.md)
- [Product feedback](docs/PRODUCT_FEEDBACK.md)
- [Friction log](docs/FRICTION_LOG.md)
- [Test report](docs/TEST_REPORT.md)
- [User testing protocol](docs/USER_TESTING.md)
- [Submission roadmap](docs/ROADMAP.md)
- [Threat model](docs/SECURITY.md)

## Limits

This is an isolated sample service, not a production multi-tenant marketplace. Workshop, equipment, calendar and general reservation records share a versioned workspace aggregate. Controlled failure injection simulates before/after-commit response loss; it is not a live outage of an external provider. Production use needs external service adapters, authentication/OAuth for external MCP clients, capacity shared across accounts, rate limits, retention controls, stronger approval-channel assurance, and independent interoperability and accessibility testing.

No sent-message retraction, payment refund, or third-party reservation restoration is promised. Browser voice input is optional and depends on browser support. The UI preserves typed input if a request fails.

## License and submission

MIT; see [LICENSE](LICENSE). Review third-party licenses before distribution; existing starter notices are retained. This repository is prepared for the Amazon Developer Hackathon. Configure the About metadata, record the English demo under three minutes, verify the build window, and complete the remaining submission fields with real evidence.

## Restaurant, appointment and event requests

In the main workspace, enter **Book a restaurant**. Answer the follow-up questions with **Jaipur**, **tomorrow at 7 pm**, and **2 people**. Review the proposed details and approve. You can also enter the full request at once or use the reservation form. Use **Edit these details** before approval, or **Change** / **Cancel** on a saved reservation. Each change needs a fresh preview and approval. Opening an edit invalidates older pending approvals. Expired previews offer a route to review again. **Calendar file** downloads a labelled snapshot for any saved reservation; later edits and cancellation do not sync automatically.

Restaurant, appointment and event providers are simulated. Saved records persist in your private workspace; no real business is contacted. The guided parser supports these flows but does not understand every possible request. The form provides an explicit path for entering supported details. Generic reservations are atomic single-record operations; the workshop examples demonstrate multi-action recovery and linked calendar changes.

## Source release

The supplied source ZIP is ready to upload to a new public repository; see [GitHub publication](docs/GITHUB_PUBLICATION.md). The included GitHub Actions workflow runs type checks, tests, a build and compiled Worker checks. Its remote status remains unverified until it runs in your repository. To regenerate the ZIP from a reviewed, committed checkout, run `python3 scripts/export-source.py`. The exporter excludes Git history and local state and removes the private hosting project identity.

## Repository layout

| Folder / file | Purpose |
|---|---|
| `app/` | Main workspace, practice page, API routes and global styles |
| `components/second-take/` | Conversation, booking reviews, request guide and recovery stories |
| `components/ui/` | Reused accessible interface primitives |
| `lib/second-take/` | Reservation engine, MCP tools, guided parsing, security and exports |
| `db/` | Database schema |
| `drizzle/` | Versioned database migrations |
| `tests/` | Domain, protocol, persistence and regression tests |
| `scripts/` | Build, local database setup, verification and source export |
| `docs/` | Architecture, demo script, feedback and submission materials |
| `public/` | Static assets |
| `.github/workflows/` | Automated verification on pushes and pull requests |
| `build/`, `vendor/` | Starter build helpers and preserved upstream notices |
| `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md` | License, contribution guidance and release history |

## Submission links

- Repository: https://github.com/ArhamChoudhary-ui/Second-Take
- GitHub username: **ArhamChoudhary-ui**
- Open Source contribution: this new MIT-licensed repository; review the actual publication date and contribution description before submitting.
- Video: record and publish the actual demo, then add its URL.
- Hosted prototype: owner-private; arrange judge access before presenting it as a public demo.
