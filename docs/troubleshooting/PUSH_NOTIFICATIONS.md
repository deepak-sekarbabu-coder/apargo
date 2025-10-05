# Push Notifications & Service Worker Troubleshooting

Last Updated: 2025-08-27

## Summary

A 500 error was occurring on requests to `/firebase-messaging-sw.js` because the Firebase Messaging service worker file was **missing** from the `public/` directory. The application attempted to register the service worker in `src/lib/push-notifications.ts`, causing registration to fail silently and push notifications to be unavailable.

## Root Cause

Documentation referenced `public/firebase-messaging-sw.js`, but the file actually existed only at `firebase/firebase-messaging-sw.js` and was never copied to `public/`, so Next.js could not serve it from the root path.

## Resolution

1. Added the file at `public/firebase-messaging-sw.js`.
2. Ensured it uses the v8 namespaced Firebase scripts (compatible with service workers) and initializes the app defensively.
3. Added a troubleshooting entry here and updated `docs/README.md`.

## File Location

- Required path: `public/firebase-messaging-sw.js`
- Client registration: `src/lib/push-notifications.ts` (`navigator.serviceWorker.register('/firebase-messaging-sw.js')`)

## Verification Steps

1. Start the dev server.
2. Open DevTools > Application > Service Workers: confirm `firebase-messaging-sw.js` is installed.
3. Check Network tab for successful 200 response for `/firebase-messaging-sw.js`.
4. Trigger `requestNotificationPermission(userId)` and verify an FCM token is logged & stored on the user document (`fcmToken`).

## Common Issues & Fixes

| Symptom                                              | Likely Cause                                       | Fix                                                                   |
| ---------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| 404/500 on `/firebase-messaging-sw.js`               | File missing or misnamed                           | Ensure file exists in `public/` exactly as `firebase-messaging-sw.js` |
| `messaging/permission-blocked`                       | User denied notification permission                | Instruct user to re-enable notifications in browser settings          |
| No FCM token generated                               | Missing `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | Add env var and restart server                                        |
| `Cannot use import statement outside a module` in SW | Used modular v9+ ESM syntax in service worker      | Use `importScripts` with v8 namespaced SDK in SW                      |
| Background messages not showing                      | No `onBackgroundMessage` handler or missing `icon` | Ensure handler exists and icon path resolves                          |

## Future Improvements

- Migrate service worker to modular messaging API when widely supported.
- Add runtime check & toast if registration fails.
- Add automated test that asserts 200 for `/firebase-messaging-sw.js`.

## Related Files

- `public/firebase-messaging-sw.js`
- `src/lib/push-notifications.ts`
- `src/components/notifications-panel.tsx`
