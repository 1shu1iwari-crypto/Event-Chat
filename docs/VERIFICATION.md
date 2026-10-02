# Verification status

2 October 2026. This document separates local application checks from live service checks.

## Passed

- `npm test`: six domain tests covering registration prerequisites, stale/conflicting evidence, duplicate ingestion, simultaneous incident categories, approval/rejection and double-booking, resolved evidence, and human-led medical escalation.
- `npm run build`: production Next.js build and TypeScript compilation passed for all application routes.
- `npm run test:browser`: headless Chromium at 1440×1000 and 390×844. Sign in → instant registration exercise → three reports → incident → acknowledge → approve two volunteers → resolve → after-action report → staff released. Mobile navigation works with no document horizontal overflow and no browser page errors. Volunteer event reset and a cross-origin mutation both returned HTTP 403.
- Visual inspection of command center, mobile layout, and human-confirmed resolution report.
- Current local REST key and session secret were absent from repository deliverables and generated browser JavaScript in a value-based credential scan.
- Read-only CometChat REST credential validation succeeded. No `eventops-` demo users existed after the blocked seed attempt.

## Browser check environment

The check starts its own production server with CometChat, model, and database credentials explicitly cleared, an isolated temporary state directory, and external browser requests blocked. This prevents the test from seeding an account or sending real messages. Screenshots are labelled local engine exercises in the README.

The standard Playwright browser download was unavailable in this workspace. Chromium was obtained from the `@sparticuz/chromium` package and selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Normal local development can use:

```bash
npm ci
npm run build
npx playwright install chromium
npm run test:browser
```

## Pending; not claimed as verified

Automatic approval review rejected remote demo provisioning. Live CometChat seed, server token login, private incident room creation, membership updates, two-client message send/receive, typing, receipts, attachments, threads/search, presence, and voice/video calls are implemented but remain untested against the selected app. The expected live sequence is documented in `DEMO.md`.

PostgreSQL persistence is implemented but was not exercised against a configured database. Optional model enrichment was not exercised with a model credential. No public deployment or challenge video has been produced.

The shared access-code staff selector and in-memory rate limiting are prototype choices, not production staff authentication. Multi-instance deployment requires a database and shared secret.
