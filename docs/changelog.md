# Changelog

## Unreleased

- Configured the production D1 binding and added migration-first Cloudflare deployment.

- Grouped database migrations with server database code and consolidated tool configuration under `config/`.
- Removed unused starter configuration and moved development details out of the main README.

- Renamed hosting configuration and runtime helpers to neutral filenames; removed the unused platform authentication module.

- Consolidated application code under `src/`, with separate components, booking logic, database access, styles, and types.
- Grouped build and maintenance utilities under `tooling/` and separated unit tests, integration checks, and helpers.
- Moved migrations and Drizzle configuration into `database/`.
- Standardized documentation filenames and simplified the repository README.
- Removed unused legacy npm installer scripts.

## Repository organization

- Shortened the main README and grouped documentation into usage, technical and submission folders.
- Removed 55 unused starter UI components, an unused mobile hook and redundant publication/planning documents.
- Preserved runtime behavior, dependency lockfile, tests and license notices.

## 0.2.0 — 2026-09-15

- Guided restaurant, appointment and event reservations with multi-turn details, explicit forms, approved changes and cancellation.
- Field-by-field change previews, editable unconfirmed plans, and a path to renew expired previews.
- Old approvals invalidated when editing starts; current saved versions loaded for edits.
- Calendar snapshots for all supported reservation services, with stable identity, timezone conversion and visible simulation/snapshot disclosures.
- Request guide, keyboard skip link, live status announcements, reduced-motion support and prevention of overlapping UI actions.
- Clarification of negated requests and correct handling of “day after tomorrow”.
- Submission text, recording script, repository publication guide, attribution disclosure and GitHub verification workflow.

## 0.1.0 — 2026-09-14

- Workshop, equipment and calendar action engine with MCP transport and D1 persistence.
- Explicit approval, partial corrections, controlled failures, reconciliation and version conflict protection.
- Three isolated recovery stories, evidence display, receipts and workshop calendar export.
- Hosted transport routed through `/api/mcp`.
