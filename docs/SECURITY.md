# Prototype security boundaries

## Implemented

- Session-isolated server records using a random 256-bit opaque HttpOnly cookie.
- SameSite=Strict; Secure on HTTPS.
- Origin validation for browser writes and MCP connections.
- Custom review header on browser action calls.
- Zod validation and allowlisted operations.
- Prepared SQL; no model-generated queries or code execution.
- Immutable plan revision bound to approval.
- Optimistic resource-version checks.
- Server AWS credential values are not exposed to the client or added to receipts. Receipts include user-entered text and should be reviewed before sharing.
- Private hosting by default.

## Important limits

Origin headers protect browsers against cross-origin scripts; non-browser clients can set them. A malicious process holding the same session cookie can call the browser action endpoint. This prototype is not cryptographic proof of a human click and does not isolate an adversarial agent from the approval authority. Production designs must separate approval credentials/capabilities from tool credentials.

Anonymous local sessions are bearer capabilities. Clearing cookies loses access. There is no account recovery or cross-device identity. Hosted access gating is separate from the app's demo session.

Production external MCP access needs a reviewed authentication/OAuth flow. The current private hosted endpoint cannot be advertised as a generally available Alexa integration.

Add rate limiting, request-size enforcement at the edge, retention/expiry and deletion policies, credential rotation, monitoring, provider-specific cancellation policies, and independent testing before accepting real customer data. Do not store health, payment, or identity documents in this demo.
