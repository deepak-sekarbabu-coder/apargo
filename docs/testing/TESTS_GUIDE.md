# Tests Guide

This guide describes testing conventions, commands, and where to find tests in the repository.

See `tests/README.md` for a human-friendly index of test files.

## Running tests

- Run all tests:

  npm run test

- Run a single test file with Jest:

  npx jest path/to/test-file.test.ts

## Structure and conventions

- Tests live in the `tests/` folder grouped by feature (admin, expense, maintenance, notifications, payments, poll, server, storage).
- Filenames use `.test.js`, `.test.ts`, or `.test.tsx`.
- Mocks are in `tests/__mocks__/` for third-party libraries.
- Keep tests small and focused; mock network and Firebase dependencies where appropriate.

## Add new tests

1. Create a test file in the relevant feature folder.
2. Use the existing tests as examples for setup and teardown.
3. Add any new mocks to `tests/__mocks__/`.
4. Update `tests/README.md` with the new test if it's a cross-cutting or important test.

## Troubleshooting

- If tests fail due to environment variables, check `.env` or CI settings.
- If Firestore rules block tests, run checks in `scripts/check-database.js`.

## Related docs

- `docs/NETLIFY_DEPLOYMENT_CHECKLIST.md`
- `docs/NETLIFY_FIREBASE_FIX.md`
- `tests/README.md`
