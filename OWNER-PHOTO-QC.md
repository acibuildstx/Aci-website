# ACI v2 Owner Photo Quality Control

**Pending owner selection.** Photos, captions and category assignments in this package are placeholders from the reviewed archive and have **not** been approved. Keep this package on staging only until the owner approves images.

## Approved gallery behavior
- Up to **8** photos shown per category (when fewer photos are approved, fewer appear).
- First photo in category display order is not necessarily the cover: configure the cover and order deliberately in the admin portal.
- No photo/caption/category changes made by this variant.
- Do not repeat identical image within a category; cross-category reuse needs explicit owner approval.
- Empty categories remain hidden until owner approves real work.
- Do not delete original photos; keep a backup.

## Owner review process
1. Owner chooses up to 8 per category from Drive photo folders; Property Maintenance has 8, with its top 3 first.
2. For each chosen photo, confirm actual job, correct category, factual caption, and publish status.
3. Confirm any before/after pairs refer to the same job and stage.
4. After final review, map the approved photos to website gallery slots, then test staging and only afterwards deploy.

## Still not ready for production
Cloudflare D1/R2, Access owner policy and Resend require owner-specific configuration and live tests. No service was activated.
