# Verification report

## Executed in the build environment

- `node --experimental-strip-types --test tests/*.test.ts`: **47 passed, 0 failed** after release finalization on September 15, 2026.
- `node node_modules/typescript/bin/tsc --noEmit`: passed for the release source.
- Production Worker/client build: passed.
- `node scripts/verify-worker.mjs`: passed with a disposable real D1 database in Miniflare.

The Worker test covers database initialization, guided interpretation, real MCP preview, refusal without approval, browser approval, execution, persisted reload, isolated sessions, and cross-origin rejection. It also runs all three recovery stories through the compiled HTTP/MCP routes and verifies that practice cannot reset or alter the main workspace.

## Hosted connection regression

Direct authenticated requests reproduced HTTP 404 with a plain-text body at `/mcp`, while `/api/state` returned valid JSON. The browser now uses `/api/mcp`, which is covered by the compiled Worker workflow test. The production build and TypeScript check passed after this change. Client tests also cover non-JSON hosting responses and structured authorization errors. Deployment verification is separate from these local checks.

## Domain and protocol coverage

Preview side effects; approval revisions and expiration; duplicate prevention; selective camera removal; selective and complete cancellation; timeouts before and after commit; unknown-outcome reconciliation; manual edits before preview and after approval; fresh consent for conflict resolution; failed cancellation retry; concurrent execution; stale inventory; SQLite restart; workspace ownership; MCP lifecycle/discovery/calls; argument validation; Origin and protocol checks; notifications and malformed JSON; bounded guided parsing.

## Not verified yet

- Browser-driven visual and end-to-end testing in this environment.
- Independent MCP SDK/Inspector interoperability.
- Real Bedrock calls, model access, latency, quality, and spend.
- External Alexa account integration.
- Five-person usability testing or measured productivity improvements.
- Long-running load, adversarial security review, or accessibility certification.

The current tests are evidence of the implemented sample workflow, not a guarantee of production reliability. Live-provider testing and user testing remain essential before submission.

## Recovery-story evidence

- Lost reply: camera record active while assistant status is unknown; recovery produces one camera record, zero duplicate records, and action attempts `[1, 2, 1]`.
- Human edit: calendar version mismatch blocks approval; preservation requires a fresh revision; the original meeting-point text remains after camera cancellation.
- Partial cancellation: calendar update remains at one attempt and version 2; camera cancellation takes a second attempt and completes.
- Exports: stable iCalendar UID, UTC times, escaped property values, UTF-8 byte folding, and HTML escaping of untrusted text.
- Current production bundle builds successfully. Browser interaction/visual testing of the new UI has not been performed in this environment.

All measurements above are controlled sample workflows. No live external booking outage or production Alexa interaction is represented.

## Reservation expansion

Compiled HTTP/MCP tests cover the reported “Book a restaurant” request, multi-turn details, exact approval, reopening a preview, editing, cancellation and preservation of existing workshop records. Domain tests cover form/chat continuity, expired approvals, duplicates, concurrency, capacity, stale versions, invalid dates, timezone aliases, midnight overlap and daylight-saving transitions. These are simulated providers; no real reservation is made.

## Finalization checks

The four new regression cases verify revoked approval after reopening a preview, invalidation of pending cancellation when editing a saved reservation, loading current saved versions, negated-action clarification, relative-date parsing, and timezone-correct calendar snapshots with escaped values and stable identity. The compiled Worker test calls the new browser revision endpoint and verifies that the old approved plan can no longer execute.

A source-file scan found no matches for common private-key, GitHub-token or AWS-access-key patterns. That bounded scan is not an independent security audit. The GitHub workflow is prepared but has not run on GitHub. Browser-driven UI testing, screen-reader testing and fresh internet dependency installation remain unverified in this environment.

The prior restaurant release was checked directly on the hosted app: “Book a restaurant” and the Jaipur/date/people follow-ups reached a successful MCP preview in a separate diagnostic session. That result does not substitute for visual testing of this release.
