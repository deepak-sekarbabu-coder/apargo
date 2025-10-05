# Firestore INTERNAL ASSERTION FAILED: Unexpected state

## Summary

An intermittent Firestore runtime error (`FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state`) was observed during authentication + initial data load. It manifested immediately after `onAuthStateChanged` fired and a user lookup by email executed, cascading into additional listener failures.

## Symptoms

- Console spam with stack traces referencing `enqueue`, `enqueueAndForget`, and `forEachTarget`.
- Authentication flow aborts; UI shows unauthenticated / stuck loading state.
- Error repeats rapidly (suggesting a retry or re-render loop).

## Root Cause (Likely)

While the opaque internal assertion does not expose a direct cause, contributing factors identified:

1. Rapid auth state transition followed by an immediate indexed query (`where('email','==',...)`) while other collection listeners spin up.
2. Divergent Firebase configuration for `storageBucket` between two client init modules (`firebase.ts` vs `firebase-client.ts`).
3. Potential browser environment edge cases (IndexedDB / tab ownership) exacerbated by many parallel listeners starting simultaneously.

## Mitigations Implemented

- Unified `storageBucket` config to `unicorndev-b532a.firebasestorage.app`.
- Switched Firestore initialization to `initializeFirestore` with conservative settings (`experimentalAutoDetectLongPolling`, `useFetchStreams`) to improve transport resilience.
- Added defensive try/catch around `getUserByEmail` in `auth-context` to swallow transient INTERNAL ASSERTION errors, allowing a clean retry on the next auth event instead of cascading failures.
- Left a fallback to the default `getFirestore` instance if enhanced init fails (avoids hard failure in unsupported environments).

## Considered (Not Yet Needed)

- Disabling persistence / multi-tab entirely (not explicitly enabled now).
- Serializing initial listeners (stagger start) – deferred unless issue recurs.
- Upgrading Firebase SDK beyond 11.10.0 (monitor release notes first to avoid regressions).

## Recovery / Workaround

If the error reappears:

1. Force a page reload (should reinitialize cleanly with new guards).
2. Capture verbose Firestore logs by enabling: `localStorage.setItem('firestoreLogLevel','debug')` prior to init.
3. Examine for repeated failing query; temporarily comment non-essential listeners to isolate.

## Next Steps / Monitoring

- Track Sentry (or console) for recurrence post-deployment.
- If still observed, evaluate SDK upgrade and enable explicit `synchronizeTabs: false`.

## References

- GitHub Issues: firebase-js-sdk #4451, #8250 (historical context for similar internal assertions).
- StackOverflow discussion on assorted causes (environment + syntax + rules).

## Change Log

- 2025-08-27: Added mitigation & documentation (see PR / commit referencing this file).
