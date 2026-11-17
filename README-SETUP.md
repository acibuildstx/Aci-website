# Absolute Custom Installations website

This repository contains the complete replacement for acibuildstx.com. The source package contains the website, Cloudflare Pages Functions, SQL schema, dependency lockfile, and tests. See `GALLERY-PHOTO-MAPPING.md` for the photographs and `CLOUDFLARE-CHECKLIST.md` for deployment and live verification.

## Local development

Use Node.js 24 LTS (Node 22.13+ is needed for the SQLite-backed tests).

```sh
npm ci
npm test
npm run build
npx wrangler d1 execute ACI_DB --local --file=schema.sql
npm run dev
```

All database commands above use **local** storage. Wrangler uses the existing binding names and resource identifiers recorded in the repository. Verify the matching resources in the Cloudflare account before deployment. `npm run build` only compiles Functions for verification; it does not deploy. Serve through Wrangler, not a plain static server, to test backend behavior. No secrets are included. Owner routes fail closed until Access is configured; there is deliberately no local authentication bypass.

For browser checks with Wrangler running:

```sh
npx playwright install chromium
node tests/browser-check.mjs
```

The browser suite defaults to `http://127.0.0.1:8788`; set `ACI_TEST_URL` for another local address. It mocks owner API responses for UI tests and does not prove a live Cloudflare login or delivery of real email.

## Files

- `public/`: V2 site, owner portal, reviewed gallery photos and covers, styles and browser scripts.
- `functions/`: Pages APIs and middleware; `lib/`: JWT verification, upload validation and gallery validation.
- `schema.sql`: additive schema including durable notification status and submission rate counters.
- `wrangler.toml`: existing Cloudflare resource names and intentionally empty account-specific Access/sender values.
- `tests/`: security, persistence, email failure, gallery and browser regression checks.
- `GALLERY-PHOTO-MAPPING.md`: source photo filenames, gallery positions, and covers for this branch.

Publish from `main` through the existing Pages project after confirming its identity and bindings. Dashboard drag-and-drop of static files alone does not deploy this Functions backend. Keep both R2 buckets private; public portfolio images are served through the application only when published. A custom public bucket URL would bypass that protection.
