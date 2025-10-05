# Maintenance Vendor Creation & Editing Flow

Date: 2025-08-25

## Summary

Refactored the Maintenance page vendor creation behavior to align with Admin page UX patterns:

- No redirect or forced navigation away from the current maintenance feature context.
- After adding or editing a vendor, the user remains on the Vendors tab (ensured programmatically) instead of being routed elsewhere.
- A success toast is shown (handled inside `VendorDialog`).
- Newly created or edited vendor receives a transient visual highlight (one-time pulse) in the list for contextual acknowledgment.
- State updates occur via the existing `MaintenanceContext` subscription + optimistic local insertion on create.

## Rationale

Previously, vendor creation UX risked disorientation by switching context. The Admin area already uses an in-place dialog pattern with toast feedback; this change brings consistency across management surfaces and reduces unnecessary mental/context switching.

## Technical Changes

- `maintenance-view.tsx`:
  - Added `highlightedVendorId` state.
  - Ensures `setActiveTab('vendors')` after submit (create or edit) for continuity.
  - Captures returned `Vendor` object from `createVendor` to set highlight id.
  - Persists last active tab in `sessionStorage` (`maintenance.activeTab`) and restores on mount so page reloads or navigations retain context.
- `vendor-list.tsx`:
  - Added optional `highlightVendorId` prop.
  - Applies visual emphasis (soft background + ring + one-time pulse animation) to the matching vendor row/card.
- `globals.css`:
  - Added `@keyframes pulse-once-highlight` + `.animate-pulse-once` utility for subtle attention animation (respects reduced-motion due to existing global policy section).

## UX Behavior

| Action        | Result                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| Add Vendor    | Dialog closes, toast shows success, Vendors tab stays visible, new vendor highlighted briefly |
| Edit Vendor   | Dialog closes, toast shows success, vendor entry highlighted briefly                          |
| Cancel Dialog | Dialog closes, no tab change                                                                  |

## Accessibility Considerations

- Highlight uses both background color and outline; duration is brief (1.4s) and does not loop, minimizing distraction.
- Users with `prefers-reduced-motion: reduce` retain existing reduced motion handling (global CSS disables long animations; highlight falls back to static styling).

## Future Enhancements

- Add focus management: move focus to highlighted vendor container after creation for screen readers (could use `ref` + `aria-live`).
- Provide inline quick actions (call / email) directly on list rows/cards.
- Add rating edit inline without reopening dialog.

## Testing

Planned Jest/RTL test (separate task) will verify:

- Vendors tab remains active after create.
- Newly added vendor appears in list without full reload.

## Backwards Compatibility

- No API contract changes.
- `VendorList` prop addition is optional and non-breaking.
- Existing dialogs & context APIs unchanged.

## Related Files

- `src/components/maintenance/maintenance-view.tsx`
- `src/components/maintenance/vendor-list.tsx`
- `src/app/globals.css`
- `src/context/maintenance-context.tsx` (unchanged behavior leveraged)
