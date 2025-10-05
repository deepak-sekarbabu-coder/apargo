# Admin Tab Persistence

Date: 2025-08-25

## Summary

Admin panel tab selection is now persisted (similar to maintenance vendor flow) so actions like approving/rejecting payments no longer reset the interface back to the Users tab. This preserves workflow context and reduces navigation friction.

## Behavior

- Active tab stored in `sessionStorage` under key: `admin.activeTab`.
- Restored on component mount if value matches a known tab.
- Updated whenever user changes tabs.
- Works across soft navigations and component re-mounts within the same browser tab.

## Implementation

- Added `activeAdminTab` state + `updateActiveAdminTab` callback in `admin-view.tsx`.
- Replaced uncontrolled `<Tabs defaultValue>` with controlled `<Tabs value ... onValueChange>`.
- Persistence logic mirrors the maintenance page approach for consistency.

## Rationale

Previously, certain actions (e.g., payment approval) triggered re-renders causing the default tab (Users) to re-activate. Persisting the chosen tab prevents disorientation and keeps users focused on their current administrative task group.

## Future Enhancements

- Support deep linking via query parameter: `?adminTab=payments` for sharable context.
- Use `localStorage` for cross-session retention (currently avoided to ensure privacy and reduce stale UI risks).
- Add analytics to measure tab usage and optimize ordering.

## Related Files

- `src/components/admin/admin-view.tsx`
- `docs/features/MAINTENANCE_VENDOR_FLOW.md` (companion pattern)
