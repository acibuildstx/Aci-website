# ACI gallery audit

Reviewed repository main at `5d7c68a` and the public site on November 20, 2026 (Central time). The live gallery endpoint returned `initialized: false`, and the served `app.js` matched the baseline file byte-for-byte. The public site therefore uses the starter list at the time of inspection. This does not establish whether older D1 records, unpublished drafts or R2 objects exist.

## Inventory and references

The 67 numbered WebPs already use two digits. Each slot below is the one-based position in the category array from `public/js/site-config.js`. Each slot feeds the homepage gallery grid and lightbox and the Owner Portal's starter editor. The homepage featured carousel and its thumbnails draw from the first nine visible categories in the public sort order, using the flagged cover or first photo. Property Maintenance uses the configured hero JPEG in those featured components regardless of its cover flag. The roofline SVG appears in the homepage header and footer. The earlier flooring SVG wraps the same bytes that `site-config.js` now stores as an inline JPEG for the hero and featured maintenance slide and thumbnail. Neither has a gallery slot. The carousel labels that slide Property Maintenance while its image is a flooring photograph. That mapping was introduced intentionally in recent history and needs an owner decision before it changes.

The ZIP contains the same 81 WebPs and roofline SVG at the corresponding `aci-website/public/…` paths. All 82 archive images match the working tree bytes. The ZIP is a historical package and its separate copy of the source is not loaded by the site. Each category's legacy `-cover.webp` is byte-identical to its numbered `-01.webp`. Current starter cover flags point at the numbered copies. No other tracked image hashes matched, and every starter URL resolves to a tracked file with no URL repeated across slots. The earlier [Drive source mapping](GALLERY-PHOTO-MAPPING.md) records the original JPG filenames. Its directions about replacing separate cover files and about the kitchen hero describe an older setup.

| Tracked path | Category | Reference |
| --- | --- | --- |
| `public/assets/aci-logo.svg` | — | Homepage header and footer. |
| `public/assets/curved-wall-flooring.svg` | Flooring subject, outside gallery | Prior featured wrapper. No current runtime reference. |
| `public/photos/bathrooms/bathroom-01.webp` | Bathroom Remodels | Slot 1, cover flag |
| `public/photos/bathrooms/bathroom-02.webp` | Bathroom Remodels | Slot 2 |
| `public/photos/bathrooms/bathroom-03.webp` | Bathroom Remodels | Slot 3 |
| `public/photos/bathrooms/bathroom-04.webp` | Bathroom Remodels | Slot 4 |
| `public/photos/bathrooms/bathroom-05.webp` | Bathroom Remodels | Slot 5 |
| `public/photos/bathrooms/bathroom-cover.webp` | Bathroom Remodels | Legacy cover copy. No starter runtime reference. |
| `public/photos/cabinetry/cabinetry-01.webp` | Cabinets | Slot 1, cover flag |
| `public/photos/cabinetry/cabinetry-02.webp` | Cabinets | Slot 2 |
| `public/photos/cabinetry/cabinetry-cover.webp` | Cabinets | Legacy cover copy. No starter runtime reference. |
| `public/photos/carpentry/carpentry-01.webp` | Carpentry | Slot 1, cover flag |
| `public/photos/carpentry/carpentry-02.webp` | Carpentry | Slot 2 |
| `public/photos/carpentry/carpentry-03.webp` | Carpentry | Slot 3 |
| `public/photos/carpentry/carpentry-04.webp` | Carpentry | Slot 4 |
| `public/photos/carpentry/carpentry-05.webp` | Carpentry | Slot 5 |
| `public/photos/carpentry/carpentry-cover.webp` | Carpentry | Legacy cover copy. No starter runtime reference. |
| `public/photos/decks/deck-01.webp` | Decks | Slot 1, cover flag |
| `public/photos/decks/deck-02.webp` | Decks | Slot 2 |
| `public/photos/decks/deck-cover.webp` | Decks | Legacy cover copy. No starter runtime reference. |
| `public/photos/fences/fence-01.webp` | Fences | Slot 1, cover flag |
| `public/photos/fences/fence-02.webp` | Fences | Slot 2 |
| `public/photos/fences/fence-03.webp` | Fences | Slot 3 |
| `public/photos/fences/fence-04.webp` | Fences | Slot 4 |
| `public/photos/fences/fence-05.webp` | Fences | Slot 5 |
| `public/photos/fences/fence-cover.webp` | Fences | Legacy cover copy. No starter runtime reference. |
| `public/photos/flooring/flooring-01.webp` | Flooring | Slot 1, cover flag |
| `public/photos/flooring/flooring-02.webp` | Flooring | Slot 2 |
| `public/photos/flooring/flooring-03.webp` | Flooring | Slot 3 |
| `public/photos/flooring/flooring-04.webp` | Flooring | Slot 4 |
| `public/photos/flooring/flooring-05.webp` | Flooring | Slot 5 |
| `public/photos/flooring/flooring-06.webp` | Flooring | Slot 6 |
| `public/photos/flooring/flooring-cover.webp` | Flooring | Legacy cover copy. No starter runtime reference. |
| `public/photos/kitchens/kitchen-01.webp` | Kitchen Remodels | Slot 1, cover flag |
| `public/photos/kitchens/kitchen-02.webp` | Kitchen Remodels | Slot 2 |
| `public/photos/kitchens/kitchen-03.webp` | Kitchen Remodels | Slot 3 |
| `public/photos/kitchens/kitchen-04.webp` | Kitchen Remodels | Slot 4 |
| `public/photos/kitchens/kitchen-05.webp` | Kitchen Remodels | Slot 5 |
| `public/photos/kitchens/kitchen-cover.webp` | Kitchen Remodels | Legacy cover copy. No starter runtime reference. |
| `public/photos/painting/painting-01.webp` | Painting | Slot 1, cover flag |
| `public/photos/painting/painting-02.webp` | Painting | Slot 2 |
| `public/photos/painting/painting-03.webp` | Painting | Slot 3 |
| `public/photos/painting/painting-04.webp` | Painting | Slot 4 |
| `public/photos/painting/painting-cover.webp` | Painting | Legacy cover copy. No starter runtime reference. |
| `public/photos/patios/patio-01.webp` | Patios | Slot 1, cover flag |
| `public/photos/patios/patio-cover.webp` | Patios | Legacy cover copy. No starter runtime reference. |
| `public/photos/property-maintenance/property-maintenance-01.webp` | Property Maintenance | Slot 1, cover flag |
| `public/photos/property-maintenance/property-maintenance-02.webp` | Property Maintenance | Slot 2 |
| `public/photos/property-maintenance/property-maintenance-03.webp` | Property Maintenance | Slot 3 |
| `public/photos/property-maintenance/property-maintenance-04.webp` | Property Maintenance | Slot 4 |
| `public/photos/property-maintenance/property-maintenance-05.webp` | Property Maintenance | Slot 5 |
| `public/photos/property-maintenance/property-maintenance-06.webp` | Property Maintenance | Slot 6 |
| `public/photos/property-maintenance/property-maintenance-07.webp` | Property Maintenance | Slot 7 |
| `public/photos/property-maintenance/property-maintenance-08.webp` | Property Maintenance | Slot 8 |
| `public/photos/property-maintenance/property-maintenance-cover.webp` | Property Maintenance | Legacy cover copy. No starter runtime reference. |
| `public/photos/renovations/renovation-01.webp` | Renovations | Slot 1, cover flag |
| `public/photos/renovations/renovation-02.webp` | Renovations | Slot 2 |
| `public/photos/renovations/renovation-03.webp` | Renovations | Slot 3 |
| `public/photos/renovations/renovation-04.webp` | Renovations | Slot 4 |
| `public/photos/renovations/renovation-05.webp` | Renovations | Slot 5 |
| `public/photos/renovations/renovation-06.webp` | Renovations | Slot 6 |
| `public/photos/renovations/renovation-07.webp` | Renovations | Slot 7 |
| `public/photos/renovations/renovation-cover.webp` | Renovations | Legacy cover copy. No starter runtime reference. |
| `public/photos/roofing/roofing-01.webp` | Roofing | Slot 1, cover flag |
| `public/photos/roofing/roofing-02.webp` | Roofing | Slot 2 |
| `public/photos/roofing/roofing-03.webp` | Roofing | Slot 3 |
| `public/photos/roofing/roofing-04.webp` | Roofing | Slot 4 |
| `public/photos/roofing/roofing-05.webp` | Roofing | Slot 5 |
| `public/photos/roofing/roofing-cover.webp` | Roofing | Legacy cover copy. No starter runtime reference. |
| `public/photos/tile/tile-01.webp` | Tile Work | Slot 1, cover flag |
| `public/photos/tile/tile-02.webp` | Tile Work | Slot 2 |
| `public/photos/tile/tile-03.webp` | Tile Work | Slot 3 |
| `public/photos/tile/tile-04.webp` | Tile Work | Slot 4 |
| `public/photos/tile/tile-05.webp` | Tile Work | Slot 5 |
| `public/photos/tile/tile-06.webp` | Tile Work | Slot 6 |
| `public/photos/tile/tile-07.webp` | Tile Work | Slot 7 |
| `public/photos/tile/tile-cover.webp` | Tile Work | Legacy cover copy. No starter runtime reference. |
| `public/photos/windows-doors/window-door-01.webp` | Windows & Doors | Slot 1, cover flag |
| `public/photos/windows-doors/window-door-02.webp` | Windows & Doors | Slot 2 |
| `public/photos/windows-doors/window-door-03.webp` | Windows & Doors | Slot 3 |
| `public/photos/windows-doors/window-door-04.webp` | Windows & Doors | Slot 4 |
| `public/photos/windows-doors/window-door-05.webp` | Windows & Doors | Slot 5 |
| `public/photos/windows-doors/window-door-cover.webp` | Windows & Doors | Legacy cover copy. No starter runtime reference. |

## Why a replacement can affect a different picture

The exact historical edit could not be identified without the original photo, intended slot or edit details. The current code shows three distinct ways results can differ from what the editor expects.

- A numbered cover URL can appear in the gallery, lightbox, featured slide and thumbnail. Overwriting that asset changes all of those views. Conversely, editing the byte-identical legacy cover copy does not update the numbered gallery slot. The hero and featured Property Maintenance image also share a configured URL.
- Display position is mutable. Reordering swaps entries, and Set Cover moves the chosen card to the front. A displayed slot is therefore not a durable photo identifier. The public lightbox index is scoped to the currently rendered list. The owner Before Pair action captures an index before asynchronous upload and writes back using that index, so a reorder or deletion before completion can attach the image to another card or fail.
- Owner uploads append a new record and allocate a server-generated UUID media key. They do not replace the selected card, and repeated original filenames do not collide in R2. A published D1 list can also point at R2 or a different static URL, so editing a bundled file may leave the currently published picture untouched. Current starter data shows no cross-category URL collision.

Add Replace Photo to each existing card using a stable photo ID scoped to its category. Backfill IDs for older rows without them and validate uniqueness. Upload the replacement to a new UUID object, then resolve the same ID again and check the original URL or a state version before updating only that card's URL. Keep its order, caption, cover flag and before-pair metadata. Show an old/new thumbnail preview, identify any featured or hero usage, and keep the previous URL and bytes for rollback. Apply the same ID-based targeting to Before Pair. A draft save should precede an explicit publish. These changes can reuse the existing upload and D1 storage paths.

## Owner Portal baseline before the follow-up

| Capability | Implementation |
| --- | --- |
| Upload new photos | Implemented for the selected category. The browser creates WebP and the API writes it to R2 along with a private original. Saving a draft persists metadata. Publishing makes the gallery reference public. Uploads past the category's display cap remain outside the public grid until promoted. |
| Replace one photo | Missing. Upload and remove are separate actions and can change the position, cover or metadata. |
| Remove from public display | Implemented by removing a record and then publishing. The card action does not delete assets. Bundled static URLs remain accessible directly. R2 URLs require owner authentication after their last published reference is removed. The UI has no per-photo hide toggle. |
| Reorder photos | Implemented with left/right controls and persisted array order. The public grid displays the first 5 by default, 8 for Property Maintenance, 10 for Flooring and Tile, and 7 for Renovations. Category ordering is partially controlled by a fixed public priority list. |
| Assign categories | Implemented at upload. Categories can be created, renamed or hidden. Moving an existing photo between categories is missing. |
| Manage without code | Implemented for the supported owner actions when owner authentication and Cloudflare bindings are available. Set Hero saves a value in D1, but the current homepage uses the configured JPEG instead. |

Cloudflare Pages serves the static files. D1's `gallery_state` holds the revision-specific draft and published JSON with metadata and URLs. A published snapshot takes precedence over the starter list, including when it intentionally contains no visible photos. The two R2 bindings contain the optimized portfolio objects and private originals respectively. The media function checks whether an R2 path is published. Production owner sign-in, unpublished D1 rows, bucket contents and email delivery were outside the public read-only check.

## Safe filename migration

After approval, build a manifest by category slug and stable photo ID covering current URLs, Drive originals, aliases, bytes, cover flags and order. Assign three-digit display names such as `flooring-001.jpg` using a fixed sequence independent of sorting. Preserve the existing WebP URLs, or add new aliases alongside them and switch references only after a preview comparing counts, sequence and rendered images. For actual JPG assets, encode real JPEGs as new files and update the media validator and serving types wherever JPG URLs are accepted. Never relabel WebP bytes as JPEG. Back up published and draft state before any authorized migration, test on isolated storage and retain both old assets and the old manifest for rollback.

## Gallery default and copy baseline

The live starter gallery opens with Property Maintenance on a fresh load. A previous version may differ. Current navigation can still open Kitchens when the user activates its tab or follows View Full Gallery while Kitchens is the featured slide. If published data omits, hides or empties Property Maintenance, the gallery selects the first eligible category. The existing fallback preserves the owner's visibility choices. The current footer already omits “and rental services.” The three service-card links stretch to the card width because the cards are flex columns. The form's success text currently differs from the requested wording.

## Branch verification

The 67 live starter URLs returned WebP bytes identical to the repository. Chromium verified the starter default, mobile category selection, all 14 visible categories and exact displayed order, the lightbox, and the responsive layout from 320 to 1440 pixels. It also verified the three service labels and button widths, the existing footer copy, and both the accepted and failed email paths using mocked responses. Portal interaction checks used mocked state and upload responses. All 18 backend tests passed and the Wrangler Functions build compiled locally. The branch diff contains no photo, logo, gallery configuration, schema, archive or deployment setting changes.

The initial changes affect `public/js/app.js` (service labels and accepted email message), `public/css/styles.css` (content-width service buttons with 44px minimum height), `public/index.html` (asset cache versions), `tests/browser-check.mjs` (regression checks), and this report. Gallery behavior already meets the initial selection requirement, which is now checked by the browser suite. No Cloudflare configuration change is required for this patch.

## Owner Portal follow-up

- **Replace Photo** previews the current and selected image. After confirmation, it uses the existing authenticated upload to create a fresh UUID object and private original. The editor verifies the selected ID and expected existing URL before applying the result. The card keeps its category, order, caption, cover flag and Before Pair. A cover replacement also changes any featured view derived from that cover. The separate hero setting keeps its existing reference.
- **Before Pair** now follows the same stable card ID and expected URL checks. Reordering during upload keeps the same target. If the photo is removed or changes, the editor reports the conflict and leaves other cards alone.
- **Move to Category** previews the selected card, then appends it to the destination without uploading again. Its URL, caption, Before Pair, rollback reference and ID travel with the card. The picker excludes destinations that already use the ID or would create two flagged covers. Pick another cover in the source first if the destination already has a cover. The destination’s visibility and display cap apply.
- **Save Draft** persists these card edits. **Publish Live** becomes available after a successful draft save. Each save checks the D1 snapshot version so a stale session cannot replace someone else’s saved draft or publication. After a conflict, reload to see the winning draft and reapply the intended edits.
- **Restore Previous** previews and swaps the current image with its immediately previous URL. Save the restored draft and publish explicitly to restore public display. This is a one-step rollback, and older R2 objects are retained. If an upload completes after a local conflict or the owner discards a draft, the unreferenced upload remains in storage. Optimized R2 URLs with no published reference require owner authentication. Bundled static files remain available at their existing paths.

Legacy records missing usable IDs get deterministic category-scoped IDs when read. The next save persists them, without a D1 schema migration or an automatic production write. The existing static filename scheme and gallery revision namespace still apply. The portal sends an empty hero override for a fresh starter gallery so draft validation accepts it, and preserves a saved override if present.

The follow-up changes the Owner Portal HTML and script, the shared gallery helpers, the owner state API, the public gallery response (which omits rollback URLs), the backend and browser tests, and this report. Production D1, R2 and authentication were neither inspected nor exercised. The existing authenticated upload and bucket configuration are reused.

Follow-up verification passed all 20 backend tests, the Wrangler build and Chromium regression checks. A local Miniflare D1 binding also verified that two simultaneous first-draft saves produce one success and one conflict, and that publishing writes both snapshots. Browser interactions used mocked owner API responses. The backend tests verified fresh upload keys and preservation of both old and new bytes using in-memory R2 substitutes.
