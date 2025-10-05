# Hydration Mismatch on Dashboard

## Issue

A React hydration warning appeared on the `/dashboard` route:

```text
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

The mismatch highlighted differences inside the `SidebarLayout` (card showing monthly total) and numerous `bis_skin_checked` attributes (injected by browser extensions like Avast or script blockers), plus client-only values.

## Root Cause

`ApargoApp` was originally rendered via a dynamic import with `ssr: false` from a server component page; later refactoring reintroduced a server component wrapper which again surfaced mismatches primarily caused by:

- Browser extensions injecting attributes before React hydration (`bis_skin_checked`, Grammarly markers, etc.).
- Client-only computed values (monthly expense totals) that intentionally render placeholders when `!isMounted` and real numbers after mount.

## Resolution

Current mitigation strategy:

1. Wrap dashboard in a pure server component that renders a dedicated client wrapper (`dashboard-client.tsx`) which fetches required client data after mount (no `ssr:false` needed now).
2. Add a pre-hydration inline script in `app/layout.tsx` (strategy `beforeInteractive`) that strips known extension-injected attributes before React hydrates.
3. Keep `suppressHydrationWarning` only at the `<html>` / `<body>` level (already present) and minimize elsewhere.
4. Guard truly client-only values (like dynamic totals) with `isMounted` to render deterministic placeholders on first paint.

## Trade-offs

- Slightly slower first paint for the dashboard shell (now purely client rendered).
- Removes possibility of streaming server HTML for that shell.

## Future Improvement Options

1. Incrementally convert stable, data-display sections into server components fed by a secure server-side data layer (admin-gated) for faster TTFB.
2. Introduce a server snapshot for monthly totals using a lightweight server action or RSC fetch to eliminate `isMounted` flicker.
3. Add an automated Playwright check to assert absence of hydration warnings in console.
4. Move extension cleanup into a tiny external script file hashed by Next for better cache control (optional; inline now for earliest execution).

## Verification

- Dev server no longer logs hydration mismatch warnings when navigating to `/dashboard`.
- All Jest tests pass.

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/dashboard/dashboard-client.tsx`
- `src/components/apargo-app.tsx`
- `src/app/layout.tsx` (pre-hydration cleanup script)
