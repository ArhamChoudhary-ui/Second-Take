# Recovery model

## Plan states

`awaiting_approval → approved → executing → completed`

Execution may pause in `awaiting_resolution`. A reconciliation request resumes already approved work. A detected version conflict requires a new preview revision and fresh approval. New plans supersede previous unexecuted previews. Expiry is enforced before approval and before first execution.

## Action states

`pending`, `completed`, `unknown`, `conflict`, `failed`.

`unknown` means the caller did not receive a trustworthy outcome. It must not be interpreted as absence of a reservation. `failed` means a known precondition or service operation needs resolution. Each action records its resource ID, expected version, dependencies, attempt count, before/after state, and error.

## Stable identities

A booking's resource key is derived from its immutable operation ID and service kind. A retry first checks whether that resource already exists. Requests using the same preview idempotency key with different arguments are rejected.

Completed actions are never replayed. Cancelling a resource marks it inactive and increments its version; historical receipts remain. A cancellation is a new compensating operation, not deletion of the original history.

## Failure scenarios

| Scenario | Persisted service state | Caller action state | Recovery |
|---|---|---|---|
| Before camera commit | No camera reservation | Unknown | Query by stable key, then create once if absent. |
| After camera commit | Camera reservation exists | Unknown | Find existing record and acknowledge it. |
| Cancellation unavailable | Earlier compensation may be complete | Failed | Resume only the remaining cancellation. |
| Manual calendar edit | Newer calendar version | Conflict | Preserve edit or stage current version for new approval. |

Fault injection is captured at preview time and fires once per operation. Changing the lab control does not alter an approved plan.

## Selective reversal

Corrections target an original booking. Calendar changes precede equipment cancellation; equipment cancellation precedes seat cancellation. The requested scope determines which actions exist in the reversal plan. Dependency links are rebuilt if a user preserves a conflicting record.

If a source operation has an uncertain outcome, reconcile it before constructing a correction. Once a correction starts, the source cannot resume and recreate resources the correction is cancelling.

## Limits

No arbitrary third-party undo, no email unsend, no refund guarantee, and no promise that a cancelled seat can later be restored. A production adapter must explicitly implement reconciliation and compensation for each side effect. A cancellation may itself fail, and the UI must retain that unresolved state.

Application crashes between a committed action and the next action are recoverable because progress is persisted. Failure injection models uncertainty between a logical service commit and its acknowledgment within the sample service; external service behavior remains future work.
