# Absolute Custom Installations website

This repository contains the existing acibuildstx.com website. The source package contains the website, Cloudflare Pages Functions, SQL schema, dependency lockfile, and tests. See `GALLERY-PHOTO-MAPPING.md` for the photographs and `CLOUDFLARE-CHECKLIST.md` for deployment and live verification.

## Local development

Use Node.js 24 LTS (Node 22.13+ is needed for the SQLite-backed tests).

```sh
npm ci
npm test
npm run build
npx wrangler d1 execute ACI_DB --local --file=schema.sql
npm run dev
```

All database commands above use **local** storage. Wrangler uses the existing binding names and resource identifiers recorded in the repository. Verify the matching resources in the Cloudflare account before deployment. `npm run build` only compiles Functions for verification; it does not deploy. Serve through Wrangler, not a plain static server, to test backend behavior. No secrets are included. Owner routes fail closed until an owner password or Cloudflare Access is configured. There is no authentication bypass.

For browser checks with Wrangler running:

```sh
npx playwright install chromium
node tests/browser-check.mjs
```

The browser suite defaults to `http://127.0.0.1:8788`; set `ACI_TEST_URL` for another local address. It mocks owner API responses for UI tests and does not prove a live Cloudflare login or delivery of real email.

## Simple owner sign-in (no additional service)

In the existing Cloudflare Pages project, select **Settings → Variables and secrets → Add** in **Production**. Add `OWNER_PASSWORD` with type **Secret**, choose a unique password/passphrase of at least 16 characters, and save. Do not send it in chat or commit it to GitHub. Redeploy after saving the secret.

Open `https://acibuildstx.com/admin`. The browser asks for username **owner** and your password. Use the same hostname for the portal and customer attachment links. This protects portal changes, draft photos and customer attachment downloads. The public homepage, published gallery and service-request form do not require this login or contact an identity service.

Leave `ACCESS_ISSUER`, `ACCESS_AUD` and `OWNER_EMAILS` empty for this option. Existing Access configuration takes precedence; adding a password does not bypass it. The password is checked only on the server over HTTPS. Ten failed sign-ins per IP in a 15-minute window temporarily block further sign-ins from that IP; counters use the existing D1 table without a schema change. Customer form counters are separate. Changing the password invalidates previous credentials after redeployment.

The browser may remember HTTP credentials for its session. On a shared device use a private window and close **all** private windows afterward; there is no application-level logout button. Do not put credentials into a URL. Preview deployments need their own secret if owner access is intended there.

## Files

- `public/`: V2 site, owner portal, reviewed gallery photos and covers, styles and browser scripts.
- `functions/`: Pages APIs and middleware; `lib/`: owner authentication, upload validation and gallery validation.
- `schema.sql`: additive schema including durable notification status and submission rate counters.
- `wrangler.toml`: existing Cloudflare resource names and notification sender and optional account-specific Access values.
- `tests/`: security, persistence, email failure, gallery and browser regression checks.
- `GALLERY-PHOTO-MAPPING.md`: source photo filenames, gallery positions, and covers for this branch.

Publish from `main` through the existing Pages project after confirming its identity and bindings. Dashboard drag-and-drop of static files alone does not deploy this Functions backend. Keep both R2 buckets private; public portfolio images are served through the application only when published. A custom public bucket URL would bypass that protection.
