# Work and attribution disclosure

Prepared September 15, 2026 from the history available in this checkout. The entrant must review this against any work outside this repository before submitting.

## Recorded project work

| Date | Work recorded in this repository |
|---|---|
| September 14, 2026 | Initial Second Take application, booking/recovery engine, MCP transport, UI and documentation |
| September 14, 2026 | Hosted MCP routing repair and clearer connection errors |
| September 14, 2026 | Independent recovery stories, state evidence, HTML receipts and workshop calendar snapshots |
| September 15, 2026 | Guided restaurants, appointments and events; multi-turn details, plans, approval, modification and cancellation |
| September 15, 2026 | Submission preparation: editable previews, renewed review after expiry, all-service calendar snapshots, request guide, approval invalidation on editing, additional regression checks and release documents |

This checkout’s initial commit is dated September 14, 2026. That establishes what is recorded here, not proof that no concept or work existed elsewhere. Disclose any earlier work you know about. The organizer’s stated submission window is August 31–October 23, 2026; see the [official rules](https://amazonappdev2026.devpost.com/rules).

## Existing components

The project starts from a Vinext/React/Cloudflare Sites starter and reuses its build configuration and UI primitives. It uses open-source dependencies listed in `package.json` and pinned in `pnpm-lock.yaml`. It does not claim authorship of those libraries or established concepts such as idempotency, optimistic concurrency and compensating actions.

Preserved notices include `tooling/vite/hosting-plugin.LICENSE` and `src/styles/vendor/shadcn-tailwind-4.13.0.LICENSE.md`. The project’s original code is offered under the root MIT license. No third-party media is needed for the demo; the favicon and interface graphics are simple project styling.

## AI assistance

The project was developed with AI coding assistance through ChatGPT/Codex for implementation, debugging, tests and documentation. Git authorship may appear as “Second Take contributors”; that is a project label, not evidence of a human teammate. Add actual team members and your own contribution description truthfully.

## Demonstration boundaries

The sample services save real records in the app database. They do not contact real restaurants, appointment providers or ticket vendors. Failure cases are deliberately injected in the workshop sample. Conversation is guided; the optional Bedrock adapter is not configured or verified live. MCP is directly implemented from the specification and has not received an independent interoperability certification.
