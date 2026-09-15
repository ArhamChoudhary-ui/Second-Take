# Understand and demonstrate Second Take

## The sentence to remember

**Second Take helps you correct and recover an assistant’s actions without losing control of what already happened.**

A booking is the setting. The problem is knowing what an assistant did, what is still uncertain, and what can safely change next.

## Walkthrough

Open **Try the demo** from your workspace. This opens `/demo`, with its own saved practice data. Starting an example replaces only practice data; your normal workspace stays separate.

| Example | What to do | What to notice |
|---|---|---|
| The missing confirmation | Start → preview → approve → inspect evidence → Check & resume | The camera exists before the assistant has confirmation. After checking, only one camera record exists. |
| The edit that stays yours | Start → preview → approve → write and save your calendar edit → preview removing camera → keep your edit → approve | Your meeting-point text remains. The camera is cancelled and the workshop stays. |
| The unfinished cancellation | Start → preview → approve → preview removing camera → approve → resume | The calendar updates once. Only the failed camera cancellation takes a second attempt. |

Preview creates a proposal. Approval authorizes that particular proposal. Check & resume completes an already approved plan; it does not grant new approval.

## What runs behind the screen

1. The guided interpreter turns a supported sentence into fields such as two seats and one camera. A configurable Bedrock adapter exists, but live AWS use is not configured or verified.
2. The browser calls MCP tools. MCP defines messages between an assistant and tools; it does not provide the booking logic.
3. Our engine checks arguments, inventory, workspace ownership, approval and resource versions.
4. The database records completed actions. A stable reservation ID lets a retry find an earlier result.
5. Cancellation is a new action that releases a supported reservation. It does not erase history or rewind arbitrary external services.

## What is real?

| Part | Current status |
|---|---|
| UI, database, tool calls, approvals, retries and edit detection | Implemented; backend workflows exercised in automated tests |
| Workshop, rental, calendar, restaurant, appointment and event services | Our sample service; no real business is contacted |
| Lost confirmation and cancellation failure | Deliberately injected, labelled scenarios |
| Conversation | Guided parser; not a live language model |
| Alexa+ | Browser simulation; no production account connection |
| Calendar file | `.ics` snapshot of a labelled demo workshop or reservation; no automatic synchronization |
| Readable receipt | Standalone HTML of saved results; not tamper-proof certification |
| AWS Builder participation | Pending demonstrated AWS usage and genuine feedback |

## Questions to understand before presenting

**Why not just retry?** The first request may already have succeeded. Check its identity before creating another effect.

**Why not undo everything?** The user may want to keep the workshop. Cancellation should match the reviewed intention.

**How does it know I edited the calendar?** A manual edit increments the record version. The next assistant change compares it with its expected version and asks you what to do.

**What does MCP contribute?** A standard tool interface with discovery and structured calls. Our engine provides the business rules.

**Is this a new computer-science invention?** No. It applies established idempotency, version checks and compensation techniques to a conversational experience. Avoid “first ever” and “universal undo” claims.

**Who is the first customer?** A community studio offering workshop seats, equipment and calendar planning through one assistant interaction. The intended value is fewer uncertain reservations and less correction work; that value still needs user or operator research.

**Can it undo payments or sent messages?** No. Each real provider needs a supported cancellation or compensation operation. Some actions cannot be reversed.

## What you still need to do

Publish the reviewed source to your public GitHub account, record the actual English demo and test with people who did not build it. Add only measured findings to the submission. Follow `SUBMISSION_CHECKLIST.md` and `DEMO_SCRIPT.md`.

## Restaurant, appointment and event requests

In the main workspace, enter **Book a restaurant**. Answer the follow-up questions with **Jaipur**, **tomorrow at 7 pm**, and **2 people**. Review the proposed details and approve. You can also enter the full request at once or use the reservation form. Use **Change** or **Cancel** on a saved reservation; each change needs a fresh preview and approval.

Restaurant, appointment and event providers are simulated. Saved records persist in your private workspace; no real business is contacted. The guided parser supports these flows but does not understand every possible request. The form provides an explicit path for entering supported details. Generic reservations are atomic single-record operations; the workshop examples demonstrate multi-action recovery and linked calendar changes.

## Final reservation controls

**What can I ask?** explains the four services and loads a supported example into the composer. **Edit these details** reopens an unconfirmed plan and invalidates its old approval. The change preview compares the actual fields. Expired plans have a fresh-review path. Every saved restaurant, appointment or event has **Change**, **Cancel**, and **Calendar file** controls. Calendar imports do not synchronize with later changes; remove or update imported events yourself.
