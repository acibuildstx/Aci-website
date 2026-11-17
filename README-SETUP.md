# ACI Website Version 2.0 — Reviewed Package

This is an independent v2 source package. Nothing was deployed and no v1 files, DNS records, domains, paid services or accounts were changed.

Read `REVIEW-REPORT.md` for findings and test limits, and `CLOUDFLARE-CHECKLIST.md` for required accounts, bindings and owner checks. Launch remains blocked until those settings and live checks are completed.

## Package and deployment handoff

Use a ZIP of this branch or a Git checkout as the complete source package. It includes the Pages Functions, static site, SQL schema, locked dependencies, and tests. A ZIP of the `public/` directory alone omits the backend.

The Wrangler configuration uses a local-only D1 placeholder and separate V2 bucket names. For any later approved rollout, provision independent V2 resources, confirm the Pages project and account in Cloudflare, and follow the checklist for bindings, secrets, Access, and live acceptance. Provision separate bindings for any preview environment.

## Local development

Use Node.js 24 LTS (Node 22.13+ is needed for the SQLite-backed tests).

```sh
npm ci
npm test
npm run build
npx wrangler d1 execute ACI_DB --local --file=schema.sql
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

- `public/`: V2 site, owner portal, reviewed gallery photos and covers, styles and browser scripts.
- `functions/`: Pages APIs and middleware; `lib/`: JWT verification, upload validation and gallery validation.
- `schema.sql`: additive schema including durable notification status and submission rate counters.
- `wrangler.toml`: required v2 resource names and intentionally empty account-specific Access/sender values.
- `tests/`: security, persistence, email failure, gallery and browser regression checks.
- `GALLERY-PHOTO-MAPPING.md`: source photo filenames, gallery positions, and covers for this branch.
- `INSPECTION-MANIFEST.json`: historical file inventory from the original review.

Use Pages Git integration or Wrangler for any later authorized deployment. Dashboard drag-and-drop of static files alone does not deploy this Functions backend. Keep both R2 buckets private; public portfolio images are served through the application only when published. A custom public bucket URL would bypass that protection.
