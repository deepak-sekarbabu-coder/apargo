# Debounced Filtering Implementation

## Overview

Interactive list filtering (vendors, expenses, faults, users, files) previously executed on every keystroke. On lower-end mobile devices this caused unnecessary renders and input jank. A shared debounce layer has been added.

## Hook Added

`src/hooks/use-debounce.ts` exports:

- `useDebounce<T>(value, delay?, options?)` returning a debounced value.
- `useDebouncedCallback(fn, delay?, options?)` returning a debounced callback + `cancel`.

### New (2025-08) Options

Both hooks now accept an `options` object:

| Option     | Type    | Default     | Description                                                                              |
| ---------- | ------- | ----------- | ---------------------------------------------------------------------------------------- |
| `leading`  | boolean | `false`     | Fire immediately on first call (improves perceived latency on mobile).                   |
| `trailing` | boolean | `true`      | Fire after the quiet period. Disable for leading-only scenarios.                         |
| `maxWait`  | number  | `undefined` | Guarantee an invocation at least once within this time (ms) even with continuous typing. |

Mobile Safari can pause timers when tab loses visibility; we now cancel timers on `visibilitychange` to avoid late stale updates when returning to the tab.

Default delay: 300–350ms (components currently use 350ms to balance responsiveness and performance). Expenses view now adds a local input state that is debounced before syncing to global filter state (two-tier debounce) to avoid upstream re-renders on every keystroke.

## Updated Components / Hooks

| Area        | File                                           | Change                                                                                    |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Vendors     | `vendor-list.tsx`                              | Debounce search input before `filterVendors`.                                             |
| Expenses    | `use-expense-filters.ts` & `expenses-view.tsx` | Debounce `expenseSearch` inside filtering hook + local input debounce before propagating. |
| Faults      | `fault-management.tsx`                         | Debounce textual fault search.                                                            |
| Users       | `admin-view.tsx` + `use-user-filter.ts`        | Two-tier: local debounced input in AdminView; hook now assumes pre-debounced term.        |
| Files       | `admin-file-manager.tsx`                       | Debounce file search term in effect.                                                      |
| Admin Users | `admin-view.tsx`                               | Local input debounced before syncing global search.                                       |

## Rationale

- Reduces redundant `.filter()` passes over arrays (which may grow) while typing.
- Smooths typing on mobile (less layout and React reconciliation per key).
- Central hook ensures consistent timing and easier future tuning.

## Usage Pattern

```tsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 350);
// use debouncedQuery in expensive computations or effects
```

## Mobile Considerations

All search inputs now defer heavy filtering until the user pauses ~350ms, aligning with guidance for touch devices where rapid keystrokes are slower and perceived latency is lower.

## Testing

Existing test suite passes (`npm test`). No behavior change assertions required because final filtered results remain identical; only timing changed.

## Future Enhancements

- Expose configurable delay per component via prop if UX feedback requires faster/slower response.
- (Done) Leading-edge option implemented; could add separate `immediate` convenience wrapper if needed.
- Metrics: integrate simple perf marks to measure list render frequency before/after (optional).
- Consider batching multiple filter fields into a single debounced state to reduce re-renders further.
