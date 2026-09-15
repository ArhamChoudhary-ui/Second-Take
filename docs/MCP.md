# MCP integration

## Endpoint and transport

`POST /api/mcp` implements stateless Streamable HTTP with JSON-RPC 2.0 messages and JSON response bodies. The negotiated protocol version is `2025-11-25`. SSE is optional and not implemented; GET and DELETE return 405. Accepted notifications return empty 202. Unsupported protocol headers are rejected.

Send `Accept: application/json, text/event-stream`, `Content-Type: application/json`, and, after initialization, `MCP-Protocol-Version: 2025-11-25`.

The browser initializes, acknowledges initialization, and invokes tools through this endpoint. It does not label a proprietary REST booking endpoint as MCP.

## Tools

| Tool | Effect | Approval |
|---|---|---|
| `list_workshops` | Read catalogue and capacity | None |
| `preview_booking` | Save a preview; no inventory mutation | None |
| `preview_change` | Save correction/reversal preview | None |
| `get_operation` | Read this session's action receipt | None |
| `execute_approved_plan` | Execute exact approved actions | Browser approval already required |
| `reconcile_operation` | Query uncertain results and resume approved work | Existing approval required; conflicts require new approval |

| `preview_service_booking` | Preview restaurant, appointment or event creation/change | None |
| `preview_service_cancellation` | Preview cancellation of one saved reservation | None |
| `execute_service_plan` | Execute exact approved reservation plan | Browser approval already required |
| `list_service_reservations` | Read this workspace’s simulated reservations | None |

Full schemas are returned by `tools/list` and defined in `lib/second-take/tools.ts`. Unknown methods and invalid parameters produce JSON-RPC errors. Expected domain failures produce tool results with `isError: true`.

## Authentication and approval

The current host is a private app. The application further isolates state using an opaque HttpOnly browser session cookie. MCP calls use that same session. The smoke client creates its own local demo session through `/api/state`; it does not get access to another user's records.

This is not an OAuth authorization server. Generic remote MCP clients cannot automatically log in to the private hosted site. The bundled browser and a local smoke client are the supported paths in this release. Do not claim production Alexa connectivity.

There is no MCP tool that grants approval. Browser approval binds to the exact operation ID and revision. The browser action endpoint validates origin and a custom action header. This prevents browser cross-site writes; it is not cryptographic proof of a human gesture against a malicious same-session HTTP client. Production agent isolation needs a separate approval authority or stronger credential separation.

## Verify

Run `pnpm test` for protocol handler tests, `pnpm verify:worker` for compiled Worker integration, and `pnpm mcp:smoke` against a running local instance. The smoke script initializes, lists tools, reads the catalogue, stages a preview, and verifies rejection without approval.

The transport is a direct minimal protocol implementation. Installation of the official SDK was unavailable in the restricted build environment. Independent interoperability with the official SDK/Inspector has not been verified and is a priority before submission. The Alexa+ simulated-experience submission route remains applicable; confirm current rules.

## References

- [MCP Streamable HTTP specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [Official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Hackathon requirements](https://amazonappdev2026.devpost.com/)
