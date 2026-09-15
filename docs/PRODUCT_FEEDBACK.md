# Product feedback — actual observations

| Tool / API | Used for | Worked well | Friction / request | Would use again? |
|---|---|---|---|---|
| MCP 2025-11-25 specification | Direct implementation of initialization, discovery, tool calls, and Streamable HTTP | Clear JSON-RPC contracts and choice of JSON responses fit short booking operations | Provide a small compatibility test suite for custom HTTP servers and more guidance on human approvals outside tools | Yes, subject to interoperability checks |
| Cloudflare D1 / Miniflare | Persistent workspace state and disposable compiled-Worker tests | Conditional updates allow one consistent inventory/receipt transition; local D1 made real persistence testing possible | Aggregate design has limited production scale; official guidance on durable partial operations would help | Yes |
| Vinext / Sites starter | React app and Worker build | Existing component catalogue and deployment bindings shortened setup | Dynamic routes are reported as unclassified; hosted `/mcp` returned 404 while `/api` routes worked, resolved by moving application calls to `/api/mcp` | Yes, with runtime verification |
| Zod | Tool and browser action validation | Strict schemas reject invalid quantities and unexpected approval flags | No material friction observed in this bounded prototype | Yes |
| Amazon Bedrock Converse | Implemented optional intent adapter | API shape supports a small constrained planning request | Live credentials/model access unavailable in this session; cannot evaluate latency, model quality, or onboarding honestly | Evaluate after live testing |
| Official TypeScript MCP SDK | Attempted installation | Not evaluated | Dependency resolution unavailable in this restricted environment; this is not evidence of an SDK defect | Evaluate in normal development environment |

Do not present a documentation review as hands-on use. Update the AWS row after actual API calls and include the selected service, model, purpose, onboarding experience, limitations, and whether you would build with it again.

## Onboarding context

MCP required reading lifecycle and transport requirements, then testing against the implemented route; independent SDK/Inspector checks remain pending. D1/Miniflare onboarding required initializing the schema and explicitly registering split Worker modules. The Sites starter provided working persistence bindings and UI components, but local transport tests did not reveal the hosted path-routing issue; an actual hosted diagnostic did. Zod required only the small project schemas. Bedrock was implemented from its API shape but not onboarded with live credentials, so its runtime experience cannot be rated yet.

## Product feature requests

- **Important — MCP recovery guidance:** publish an example distinguishing a failed request from an unknown business outcome, including provider operation IDs and safe reconciliation. This is critical to user trust when tools create durable effects.
- **Important — approval examples:** show how hosts bind approval to exact plan revisions and handle human edits between planning and execution. An MCP tool annotation alone is not authorization.
- **Nice-to-have — hosting route diagnostics:** identify reserved or intercepted endpoint paths at deployment time so local successes do not become unexplained hosted 404s.

These are requests from this implementation experience, not claims that Amazon services caused every listed friction point.

## Additional development tools

| Tool | Use, onboarding and observed result | Improve / use again? |
|---|---|---|
| ChatGPT/Codex | AI-assisted source changes, debugging, tests and submission documents in the shared project. Existing app/source context helped carry repairs through to deployment. | Clearer distinction between proposed and actually published changes would reduce confusion. Would use again with concrete verification. |
| React / TypeScript | Shared UI state and typed plan/reservation contracts, using the starter setup. Type checking caught interface mismatches before building. | Broad conversation-state types can become hard to maintain; keep domain contracts focused. Would use again. |
| Radix UI / Tailwind / Lucide | Existing dialog, selection and tab primitives, responsive styles and functional icons. Reused the established project components. | Keyboard and visual usability still need human evaluation. Would use again for a consistent interface. |
| Node.js / SQLite test adapter | Built-in test runner and disposable local stores for approval, recovery and persistence cases. | Keep the documented Node version consistent with SQLite availability. Would use again. |
| GitHub Actions | Prepared a workflow for a public source release. | It has not run in an actual GitHub repository yet; no hands-on runner reliability claim. |

The final release corrected two project-level issues: opening an edit now supersedes earlier approvals, and “day after tomorrow” is no longer partly treated as a location. These were our application defects, not Amazon SDK defects.
