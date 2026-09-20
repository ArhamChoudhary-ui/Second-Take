# Contributing

Run the [setup and verification commands](../README.md). Keep changes scoped to a user-visible problem and include a reproducible example in the pull request. Preserve the lockfile, third-party notices and explicit simulation labels.

For a new provider, define the supported operations and cancellation rules, stable request/resource identities, failure outcomes, and version or equivalent conflict protection. Do not mark an external action successful until its provider outcome is established. New preview controls must never grant approval implicitly.

Add focused regression tests when changing approval, execution, ownership, inventory, date handling or recovery semantics. Describe which checks you actually ran. Never include credentials, session cookies, personal conversation exports or database files in an issue or pull request.

This is an MIT-licensed prototype. Live providers, independent MCP interoperability and human usability research remain useful follow-up work; consult the [security notes](../docs/technical/security.md) before treating it as a production service.
