# Hydration Mismatch Fix Documentation

## Problem

React hydration mismatches were occurring due to browser extensions (specifically AVG Secure Browser) injecting attributes like `bis_skin_checked="1"` into DOM elements after server-side rendering but before client-side hydration completed.

## Error Details

```
Error: A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

The specific attributes causing issues:

- `bis_skin_checked="1"` (AVG Secure Browser)
- `data-new-gr-c-s-check-loaded` (Grammarly)
- `data-gr-ext-installed` (Grammarly)
- Other browser extension attributes

## Solution Implemented

### 1. Pre-Hydration Script Cleanup

**File**: `src/components/extension-attr-cleanup.tsx`

- Changed script strategy from `afterInteractive` to `beforeInteractive`
- Enhanced script to run multiple cleanup passes
- Added more robust error handling and node type checking
- Script now runs immediately, on DOM ready, and with delayed retries

### 2. CSS Safety Rules

**File**: `src/app/globals.css`

Added CSS rules to handle any remaining extension attributes:

- Reset styling issues caused by extension attributes
- Ensure proper z-indexing
- Handle hydration safety for specific attribute values
- Suppress transition flashes during cleanup

### 3. Component-Level Suppression

**Files Modified**:

- `src/components/ui/toast.tsx` - Added `suppressHydrationWarning` to ToastViewport
- `src/app/(dashboard)/dashboard/dashboard-client.tsx` - Added to loading div

### 4. Continuous Cleanup

**File**: `src/components/client-root.tsx`

Client-side mutation observer continues to clean up any dynamically injected attributes after hydration.

## Implementation Details

### Pre-Hydration Script Strategy

```javascript
// Runs multiple cleanup passes
clean(); // Immediate
setTimeout(clean, 10); // Delayed
setTimeout(clean, 50); // More delayed

// Continuous monitoring
const mo = new MutationObserver(mutations => {
  // Clean up attributes as they're added
});
```

### CSS Protection

```css
/* Handle extension attributes gracefully */
[bis_skin_checked='1'] {
  display: revert !important;
  visibility: visible !important;
}

/* Suppress transitions during cleanup */
html[data-hydration-root='true'] [bis_skin_checked] {
  transition: none !important;
}
```

## Testing

To test the fix:

1. Install a browser extension that modifies DOM (like AVG Secure Browser)
2. Run the development server: `npm run dev`
3. Navigate to `/dashboard`
4. Check browser console for hydration warnings (should be resolved)

## Future Considerations

- Monitor for new browser extension attributes that might cause similar issues
- Consider adding telemetry to track hydration mismatch occurrences
- Update the extension attribute list as new problematic extensions are discovered

## Related Files

- `src/components/extension-attr-cleanup.tsx`
- `src/app/globals.css`
- `src/components/client-root.tsx`
- `src/components/ui/toast.tsx`
- `src/app/(dashboard)/dashboard/dashboard-client.tsx`
- `src/app/layout.tsx`
