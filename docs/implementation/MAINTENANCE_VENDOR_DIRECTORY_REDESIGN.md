# Maintenance Vendor Directory Redesign

Date: 2025-08-23

## Goals

- Improve desktop readability and scannability
- Provide mobile-first card grid layout
- Add quick filtering (search + inactive toggle)
- Standardize visual language (badges, stars, buttons)
- Enhance accessibility (aria labels, focus styles)

## Key Changes

1. Added `vendor-status-badge.tsx` – reusable status badge (active/inactive) with color tokens & a11y labels.
2. Added `vendor-rating-stars.tsx` – compact star rating component with numeric value.
3. Added `vendor-filter.ts` – pure helper for vendor filtering logic (enables isolated unit tests).
4. Refactored `vendor-list.tsx`:
   - New header with search input + inactive toggle + primary action button.
   - Desktop (≥1280px) table: sticky header, tighter columns, truncation + titles, subtle zebra hover.
   - Mobile / tablet (<1280px): responsive card grid (1–2 columns) with service chip, stars, compact contact section.
   - Accessibility: aria-labels for interactive elements, focus-visible rings, semantic buttons.
5. Added unit tests (`vendor-list.test.tsx`) validating core filter logic (active filtering & search).
6. Converted previous script-like pagination test to real Jest tests (no empty suite failure).
7. Jest setup expanded: Babel + React + TypeScript pipeline to support component code if needed later.

## Usage Notes

- To extend filtering (e.g., by rating/service), add args to `filterVendors` and corresponding controls in the header.
- Keep rating scale consistent (currently 1 decimal). Adjust rounding logic inside `vendor-rating-stars` if half-stars needed.
- Badge colors follow Tailwind + dark mode friendly translucency; adjust via utility classes only.

## Future Enhancements (Optional)

- Column sorting (name, rating, last used) via head buttons.
- Server-side or debounced search for large vendor lists.
- Pagination / virtual scroll if vendor count grows > 200.
- Inline quick actions (call/email) with tel/mailto links.
- Display average response time metrics if tracked.

## Testing

`npm test` now covers pure filtering logic (fast, no React rendering) and existing suites remain green.

## Screens / Breakpoints

- `xl:` breakpoint chosen for table switch to maximize card usage on narrow laptops; tweak to `lg:` if you prefer earlier table.
- Sticky header only visible when table scrolls vertically.

---

This document summarizes the scope & rationale of the redesign for maintenance vendor management.
