# ACI v2 — Cloudflare Setup & Deployment Checklist

Use the existing ACI Cloudflare Pages project and data resources. Confirm the project, account, production branch, D1 binding and both R2 bindings in Cloudflare before deploying. Preserve customer data and storage.

## Accounts and prerequisites

| Account/access | Needed for |
| --- | --- |
| Cloudflare account with Pages/Workers, D1, R2 and Zero Trust administrative access | Existing Pages project, database, buckets and owner login. Start with free plans where available and check current quotas. R2 may require billing enrollment/payment details even within its free allowance; do not activate it without owner approval. |
| Resend free account | API key and an already verified sender domain/address. `onboarding@resend.dev` is intentionally disallowed because its sandbox restrictions do not support general production notification routing. If domain verification requires new DNS records, treat that as a separate owner decision; no DNS change is authorized by this review. |
| Owner email identity | Sign-in through Cloudflare Access (email OTP or approved identity provider), plus the exact owner allowlist. Protect the account itself with MFA. |
| Local Node.js 24 LTS and npm, and access to the existing GitHub repository | Install locked dependencies, compile Functions and run tests. No repository or hosting service was created. |

## Resource bindings — same names in code, Wrangler and Pages environments

| Binding | Kind | Existing resource recorded in Wrangler |
| --- | --- | --- |
| `ACI_DB` | D1 database | `aci-website`. Verify the database ID in `wrangler.toml` against the existing ACI account. |
| `ACI_PUBLIC_BUCKET` | R2 bucket | `aci-portfolio-public`. **Keep bucket public access, r2.dev and public custom-domain serving disabled.** Published image access goes through `/api/public-media/…`; otherwise drafts would be exposed. |
| `ACI_PRIVATE_BUCKET` | R2 bucket | `aci-client-uploads`. **No public access or public custom domain.** Stores customer submissions and owner originals. |

Use the existing production bindings after verifying their resource identities. Keep customer storage private.

Apply **the complete `schema.sql`** to the chosen v2 D1 database. It is additive and can be applied again; back up any existing v2 database first. Tables: `gallery_state`, `inquiries`, `private_media_tokens`, `email_notifications`, `inquiry_rate_limits`. It does not drop data. For a local check only:

```sh
npm ci
npm test
npm run build
npx wrangler d1 execute ACI_DB --local --file=schema.sql
npm run dev
```

The reviewer ran only local database commands. Applying SQL to a cloud database requires the owner to select the correct v2 database in its D1 console or deliberately authorize a remote command later.

## Secret and runtime variables

Configure separately for every intended Pages environment. Do not put secrets in source, screenshots, browser scripts or the ZIP.

| Name | Type | Required value |
| --- | --- | --- |
| `RESEND_API_KEY` | **Encrypted secret** | Resend sending key scoped as narrowly as practical. Store in Pages secret settings; never in TOML. |
| `FROM_EMAIL` | Variable | Actual address on the verified Resend domain, such as `website@your-verified-domain`. No angle brackets or display name; code supplies the display name. |
| `ADMIN_NOTIFY_EMAIL` | Variable | Owner notification recipient. Supplied default is `acibuildstx@gmail.com`; owner must confirm it. |
| `ACCESS_ISSUER` | Variable | Exact `https://YOUR-TEAM.cloudflareaccess.com` team origin. |
| `ACCESS_AUD` | Variable | Exact Access application Audience (AUD) tag. If several owner path apps are used, comma-separate their exact tags. |
| `OWNER_EMAILS` | Variable | Comma-separated email addresses authorized to own the portal and read customer attachments. Must match Access identities. |

The tracked database ID and bucket names come from the repository’s existing configuration. The Access audience and sender settings must be supplied in the hosting environment. `PUBLIC_MEDIA_BASE_URL` is removed: serving the R2 bucket directly defeats draft controls. Keep the existing client `mediaBaseUrl` empty; reviewed browser code intentionally uses application-hosted paths only.

## Cloudflare Access coverage

- Configure a self-hosted Access application/policies for the chosen supported hostname, with an **Allow** policy restricted to the exact owner identities, no broad Bypass/Everyone rule. Include `/admin`, `/admin/`, `/admin.html`, `/api/admin/*` and `/api/media/*`. Account for Pages’ clean-URL redirects. Copy issuer/AUD/owner values into the runtime environment.
- Verify the hostname is supported for the intended production application before committing to it. Pages’ built-in preview Access switch must **not** be assumed to protect production. If production Access requires a custom hostname in your account, domain/DNS work remains a separate launch prerequisite and requires separate approval. Without a working Access sign-in flow, this package deliberately keeps the portal and attachments inaccessible.
- Sign in on the same site hostname before viewing draft photo URLs. Unpublished `/api/public-media/*` images verify the signed Access cookie; published images remain public. Do **not** blanket-protect this public-media route, the public gallery or the service-request endpoint.
- Check production `pages.dev`, preview URLs and any future custom host independently. Do not leave an alternative deployment hostname as an untested route to private data. Server-side JWT checks remain active even when an edge policy is missing.

## Pages project settings (for a later authorized deployment)

- Project: confirm the existing ACI Pages project in Cloudflare. Production branch: `main`. Framework: none. Root: folder containing `wrangler.toml`, `functions/` and `public/`.
- Build command: `npm run build`; output directory: `public`; Node: 24 LTS. Install through `npm ci`/the lockfile. `build/` is compile-verification output, not the site output directory. Pages builds the `functions/` directory for deployment.
- Deploy through Pages Git integration or Wrangler with the project’s source and `functions/` present. **Static dashboard ZIP drag-and-drop alone is insufficient for this backend.** No deployment command was executed during review.
- Preserve `public/_routes.json` and `_headers`; confirm owner aliases and API routes run middleware. Connect `acibuildstx.com` and `www.acibuildstx.com` to the existing Pages project and redirect `www` to the apex. Confirm HTTPS and API responses at the apex.

## Data retention and operations

- Choose a customer-data retention policy before launch. Configure an R2 lifecycle rule scoped to `customer-submissions/` only (for example, owner-approved 30-day retention, longer than the 14-day link lifetime). Do not expire `originals/` accidentally.
- Expired token rows and inquiries require a separately managed deletion policy; do not run blanket deletes. Gallery objects removed from publication and originals remain stored until deliberately cleaned up. Review orphaned uploads periodically and protect database backups.
- Monitor saved requests with failed or pending notification; the portal has no inquiry inbox or automatic retry. In the restricted **v2 D1 console**, this read-only query lists notification records needing attention:

```sql
SELECT i.id, i.created_at, n.status, n.updated_at
FROM inquiries AS i
LEFT JOIN email_notifications AS n ON n.inquiry_id = i.id
WHERE n.status IS NULL OR n.status <> 'accepted'
ORDER BY i.created_at DESC;
```

Review matching inquiry details only inside the authenticated console. A request left `pending` may have been accepted before an interrupted status update; check Resend records before manually following up. For `accepted` records, use the provider ID and Resend delivery/bounce logs. API acceptance does not prove delivery. No customer mail or retries are automatically sent by the checklist.

## Live acceptance gate — after production deployment

| Check | Required result |
| --- | --- |
| Authorized and unauthorized sign-in, all hostnames/aliases | Owner can use portal and media. Signed-out/unauthorized users cannot read or mutate admin data or retrieve customer files, even with a valid token. Forged email headers do not authorize. |
| Normal request with real phone photos/video | One inquiry, correct attachment records/objects and notification state in intended D1/R2 resources; saved reference displayed. Test 25MB/file and 30MB aggregate limits on target devices. |
| Resend success and deliberately invalid key/sender in an isolated test environment only | Owner actually receives the normal notification; provider logs distinguish accepted/delivered/bounced. Invalid configuration saves request but shows warning and records failed/unconfirmed status. Restore test secrets afterward. |
| Draft/publish | Upload/reorder/caption/cover/hero/before-pair changes survive draft reload, stay out of public view until published, and appear after publishing. Hiding every category stays empty. Removed portfolio URLs cannot be fetched anonymously through the proxy. |
| Privacy/expiry/retention | Customer links require login, expire at 14 days, download safely and are not cached. Buckets have no public endpoints. Lifecycle and manual data-handling responsibility are confirmed. |
| Desktop and phones | Navigation, all gallery tabs/select, mobile menu, form validation, supported media formats and failures work; approved appearance remains intact. |

Until these checks pass, do not describe the installation as production-ready or email as delivered. No paid upgrade is required by the source code, but free-tier capacity and account eligibility are not guaranteed.
