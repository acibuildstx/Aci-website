# ACI Website Version 2.0 — Reviewed Package

This is an independent v2 source package. Nothing was deployed and no v1 files, DNS records, domains, paid services or accounts were changed.

Read `REVIEW-REPORT.md` for findings and test limits, and `CLOUDFLARE-CHECKLIST.md` for required accounts, bindings and owner checks. Launch remains blocked until those settings and live checks are completed.

## Local development

Use Node.js 24 LTS (Node 22.13+ is needed for the SQLite-backed tests).

```sh
npm ci
npm test
npm run build
npx wrangler d1 execute aci-db --local --file=schema.sql
npm run dev
```

All database commands above use **local** storage. The placeholder D1 ID is intentional until the owner configures a separate v2 cloud database. `npm run build` only compiles Functions for verification; it does not deploy. Serve through Wrangler, not a plain static server, to test backend behavior. No secrets are included. Owner routes fail closed until Access is configured; there is deliberately no local authentication bypass.

For browser checks with Wrangler running:

```sh
npx playwright install chromium
node tests/browser-check.mjs
```

The browser suite defaults to `http://127.0.0.1:8788`; set `ACI_TEST_URL` for another local address. It mocks owner API responses for UI tests and does not prove a live Cloudflare login or delivery of real email.

## Files

- `public/`: approved site, owner portal, 60 existing photographs, styles and browser scripts.
- `functions/`: Pages APIs and middleware; `lib/`: JWT verification, upload validation and gallery validation.
- `schema.sql`: additive schema including durable notification status and submission rate counters.
- `wrangler.toml`: required v2 resource names and intentionally empty account-specific Access/sender values.
- `tests/`: security, persistence, email failure, gallery and browser regression checks.
- `INSPECTION-MANIFEST.json`: original-file inventory and before/after hashes.

Use Pages Git integration or Wrangler for any later authorized deployment. Dashboard drag-and-drop of static files alone does not deploy this Functions backend. Keep both R2 buckets private; public portfolio images are served through the application only when published. A custom public bucket URL would bypass that protection.
