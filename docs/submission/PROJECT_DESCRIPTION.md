# Second Take — Devpost form text

Prepared for review. Fill the actual identity and link fields at the end; this document does not submit an entry.

## Project name

Second Take

## Tagline

Change your mind. Keep control.

## Short description

Preview, approve, correct and recover assistant bookings, with saved evidence, duplicate prevention and protection for your own edits.

## Inspiration

What happens when an assistant reserves something but loses the confirmation? Repeating the request could create a duplicate. Cancelling everything could undo something the person still wants. We built Second Take around this moment: helping people understand what happened and decide exactly what should change next.

## What it does

Second Take is a software-only Alexa+ experience simulation. A person can plan a workshop with a camera rental and an in-app calendar event, inspect the proposed actions, and approve the exact plan. If the camera confirmation is lost, Second Take checks the existing reservation before continuing. If the person later brings their own camera, it cancels the rental while keeping the workshop. A newer manual calendar edit triggers a fresh decision instead of being silently overwritten.

Three separate practice stories show a missing confirmation, a protected human edit and a partially completed cancellation. Evidence compares the assistant’s known result with the service’s saved record, including retry attempts and resource versions.

The normal workspace also supports simulated restaurants, appointments and events. Conversation collects missing details, while forms provide a direct alternative. Users can edit a preview, compare changed fields, approve, modify or cancel a saved reservation, and download readable receipts or labelled calendar snapshots. Expired previews must be reviewed again.

## How we built it

We used React, TypeScript and a Vinext/Cloudflare Worker application with D1 persistence. The browser invokes ten tools through our MCP Streamable HTTP endpoint using protocol version 2025-11-25. A guided interpreter supplies structured arguments; Zod validates them. The engine checks workspace ownership, inventory, explicit approval revisions, expected resource versions and stable action identities.

The workshop workflow records each step separately so an interrupted plan can be reconciled. Restaurant, appointment and event changes are atomic within the same versioned workspace store. The UI’s approval controls and tool execution are separate operations. Calendar export uses stable event identities and UTC times while making snapshot limitations explicit.

This is our own sample service, not a production Alexa integration or a connection to real businesses. The conversation is guided rather than unrestricted AI. An optional Bedrock adapter exists, but live AWS usage is not configured or claimed.

## Challenges we ran into

A lost response does not reveal whether a reservation happened. We had to distinguish failed and unknown actions and check existing records before retries. Keeping a person’s calendar edit also required comparing versions and binding the next approval to a fresh preview. We discovered a hosting route problem during actual use and moved browser MCP requests to the working `/api/mcp` route. User feedback that restaurant requests were rejected led to dedicated multi-turn reservation flows and a visible capability guide.

## Accomplishments

The automated suite passes 47 tests covering approval, recovery, persistence, ownership, inventory, date handling and exports. Compiled Worker/D1 verification exercises the actual HTTP/MCP workflow, all three recovery stories, restaurant follow-ups, preview revision, changes and cancellation. The controlled recovery case ends with one camera record and zero duplicate records. The human-edit case retains the chosen note. These are reproducible system results, not measured user productivity claims.

## What we learned

Reliable assistant actions need more than a successful tool response. People need to see the exact proposal, know which effects are confirmed, and retain control when their intention changes. A clear form and honest simulation labels also make a bounded conversation easier to understand and demonstrate.

## What is next

Test the workflows with community-studio operators and new users; independently verify MCP interoperability; then connect one provider with documented reservation and cancellation semantics. Measure correction success, time to recover and how often users misunderstand an uncertain result. Live AI and additional providers should preserve the same approval and recovery rules.

## Built with

TypeScript, React, Vinext, Cloudflare Workers, Cloudflare D1, MCP, Zod, Radix UI, Tailwind CSS, Lucide, Node.js and Miniflare. Developed with ChatGPT/Codex assistance; existing starter and dependency notices are retained.

## Track and mini challenge

Primary: **Alexa+ — simulated experience**, supported by a working MCP endpoint.

Open Source: the MIT-licensed source is published at the repository below. Review eligibility and complete the contribution fields before submitting.

AWS Builder: **do not select for this build**; live AWS use has not been demonstrated.

## Tool feedback

Use the reviewed content of `docs/submission/PRODUCT_FEEDBACK.md`. Attach the observed entries from `docs/submission/FRICTION_LOG.md` in the optional feedback fields where supported. Do not claim untested API experience.

## Fields only the entrant can finalize

- Public GitHub repository URL: https://github.com/ArhamChoudhary-ui/Second-Take
- GitHub username: ArhamChoudhary-ui
- Open Source contribution URL: https://github.com/ArhamChoudhary-ui/Second-Take
- Public English YouTube/Vimeo demo, under 3 minutes: [ACTUAL VIDEO URL]
- Judge access instructions: [VERIFIED ACCESS ROUTE; THE CURRENT HOSTED APP IS OWNER-PRIVATE]
- Actual entrant/team members: [ACTUAL NAMES]
- Work disclosure: this checkout records project work beginning September 14, 2026, with earlier open-source starter components and AI assistance. Review `docs/submission/BUILD_DISCLOSURE.md` and disclose any additional pre-existing work.

Suggested Open Source contribution description is in `docs/submission/README.md`. Never replace missing links with invented ones.
