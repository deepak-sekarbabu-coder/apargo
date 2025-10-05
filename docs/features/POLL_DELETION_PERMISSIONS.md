# Poll Deletion Permissions

Effective change: Only the poll creator or a user with the `incharge` role can delete a poll. Regular `admin` users may no longer delete polls they did not create.

## Rationale

Data ownership and audit integrity: Prevents broad removal of community inputs by unrelated admins. The `incharge` role acts as a super-moderator/override.

## Behavior Matrix

| Role        | Can delete own poll | Can delete others' poll |
| ----------- | ------------------- | ----------------------- |
| creator     | Yes                 | N/A                     |
| admin       | Yes (own only)      | No                      |
| incharge    | Yes                 | Yes                     |
| user/tenant | No                  | No                      |

## UI Changes

Delete buttons are now conditionally rendered only when the current user is the creator or has the `incharge` role.

## API Changes

`deletePoll(pollId, currentUser)` now requires the current user context. It throws:

- `Not authenticated` if no user is provided.
- `Poll not found` if the document does not exist.
- `You do not have permission to delete this poll` when ownership/role checks fail.

## Follow-Up Ideas

- Add server-side callable function enforcement when moving security rules beyond permissive dev rules.
- Log deletion events to an audit collection.
