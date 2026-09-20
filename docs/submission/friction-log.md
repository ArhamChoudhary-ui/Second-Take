# Friction log

Entries record observed behavior, not hypothetical complaints. Severity refers to this project.

| Task | Expected | Observed | Severity | Workaround | Actionable suggestion |
|---|---|---|---|---|---|
| Install starter dependencies | Reuse local cache | Initial attempt encountered a restricted registry request; the supported installer retry reused 628 packages and downloaded none | Moderate | Retained the prescribed installer and lockfile flow | Make cache-only installation status easier to inspect |
| Install official MCP SDK | Resolve pinned package | Package was unavailable in the offline metadata cache | Moderate | Implemented a documented minimal protocol transport and retained interoperability as an explicit gap | Pre-provision the SDK in hackathon environments; do not blame SDK behavior for network restrictions |
| Test compiled Worker with Miniflare | Auto-resolve compiled modules | Dynamic import specifiers required an explicit module list | Moderate | Enumerated the built JS modules in the test harness | Include a compiled-Worker testing example using dynamically split bundles |
| Classify build routes | Identify client page and API routes | Build emitted an unclassified-page notice, but completed | Low | Verified compiled API routes separately | Improve classification or clarify the notice's runtime implications |
| Call MCP on the hosted app | Reach the application's `/mcp` handler | Authenticated `/mcp` returned plain-text 404 while `/api/state` returned JSON; the UI showed a generic connection failure | High | Added `/api/mcp` and switched browser requests; added explicit handling for non-JSON responses | Document hosting path restrictions and test transport endpoints through deployed routing |

Template for future entries: attempted task; steps; expected result; actual result; severity; workaround; precise suggested improvement. Keep API errors free of keys, cookies, and personal data.

## Application feedback and corrections

| Attempt / steps | Expected | Observed | Severity | Resolution | Suggestion |
|---|---|---|---|---|---|
| User typed “Book a restaurant” into the original workshop-only chat | A reservation flow or a specific explanation | Generic guided-demo rejection | High | Added dedicated restaurant, appointment and event flows, forms and a request guide; live restaurant command/preview verified in the preceding release | Put supported capabilities next to the composer |
| Review an already approved reservation and open an edit | Old approval should no longer execute | Review found that opening the form did not supersede earlier generic plans | High | Opening an edit now invalidates pending approvals; automated tests reject the old execution | Treat revision editing as an explicit approval boundary |
| Test a request with “in Jaipur day after tomorrow” | City Jaipur and a date two days ahead | Regression test found city “Jaipur day after” | Moderate | Added a date-phrase boundary and regression test | Test combinations of location and relative dates together |

These entries describe Second Take’s application behavior. They are not complaints about untested external APIs.
