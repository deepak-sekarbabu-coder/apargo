# Server-side expense filtering

## What changed

- `src/lib/firestore.ts` now performs server-side queries to avoid client-side scanning of the entire `expenses` collection when showing expenses relevant to an apartment.
- `getExpenses(apartment)` runs two parallel queries:
  - where('paidByApartment', '==', apartment)
  - where('owedByApartments', 'array-contains', apartment)
    and merges results by id.
- `subscribeToRelevantExpenses` now subscribes to the two queries above and merges live updates, instead of listening to all expenses and filtering client-side.

## Why

- Previously the client subscribed to the full `expenses` collection and filtered locally, which is very inefficient and doesn't scale.
- This change reduces network usage and Firestore read costs by only retrieving relevant documents.

## Notes & next steps

- Firestore query limitations: OR across different fields still requires multiple queries; we merge results client-side but only for the subset returned by the server.
- Denormalization suggestion: Add a `participants` or `relatedApartments` array on each expense containing both the paying apartment and owed apartments. That allows a single `array-contains` query and simpler listeners.
- If denormalization is added, update `addExpense` / `updateExpense` to populate/maintain the array.
- Consider maintaining an `outstandingBalances` summary document per apartment that is updated in Cloud Functions or via batched writes on expense updates to avoid scanning expenses for dashboards.

## Compatibility

- Hooks and components using `getExpenses` and `subscribeToRelevantExpenses` should continue to work. UI filtering (search, category, month) still happens in `use-expense-filters` but now operates on a smaller dataset.

## Testing

- Verify dashboard and expense list for users with and without apartment assignments.
- Check Firestore rules and composite indexes if needed (array-contains should be allowed).
