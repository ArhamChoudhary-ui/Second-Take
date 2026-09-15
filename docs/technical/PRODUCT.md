# Product brief

## Problem

A conversational request can create multiple related changes. If the user changes their mind or a service response is lost, it is difficult to tell what happened and what should be corrected. Retrying without checking can duplicate a reservation; indiscriminate undo can erase a later manual edit.

## Audience and product

Customers at a community activity centre book a photography workshop, borrow a camera, and add the session to their personal calendar. Second Take provides a reviewable plan, explicit approval, a persistent action receipt, and selective correction.

The first release is a browser-based Alexa+ experience simulation with its own working sample booking services. It requires no hardware. The guided interpreter is deliberately bounded; the UI labels that boundary.

## Acceptance criteria

| Journey | Observable success |
|---|---|
| Preview | Seats and equipment remain unchanged until approval. |
| Approve | Only the reviewed plan revision can execute. |
| Correction | Camera rental is cancelled; workshop remains; calendar note is corrected. |
| Selective undo | User can preserve the workshop and remove related extras. |
| Lost response | Existing equipment reservation is reconciled without a duplicate. |
| Capacity race | Execution rechecks capacity and refuses overselling. |
| Manual edit | A newer calendar version requires a fresh decision. |
| Restart | Persistent action state can be resumed after restart. |
| Ownership | Another session cannot inspect or act on the operation. |
| Audit | Receipt distinguishes completed actions from unresolved outcomes. |

## Deliberate scope

Three workshops, one camera type, an in-app calendar, plus restaurant, appointment and event reservation simulators. Capacity is session-isolated; there is no billing. New previews expire after 15 minutes. A superseded preview cannot execute. Each workspace allows up to 150 workshop plans and 150 general reservation plans before that flow requests a reset.

## Measurable hypotheses, not claimed results

Five usability participants should be able to identify which records changed, recover the lost-response scenario, and explain whether a retry made a duplicate. Measure completion, time, mistakes, and understanding. Actual results are not yet available.

## Extended reservation acceptance

| Journey | Observable success |
|---|---|
| Missing details | A partial restaurant, appointment or event request asks for missing details and shows an editable form. |
| Preview revision | Reopening details supersedes old approvals; the saved reservation is unchanged. |
| Change comparison | The user sees old and new values for changed reservation fields. |
| Expiry | An expired preview requires a fresh review before approval. |
| Calendar export | A labelled snapshot uses the saved timezone and stable identity; no external write or automatic synchronization is claimed. |
| Discovery | The request guide explains the supported services and fills a usable example. |
