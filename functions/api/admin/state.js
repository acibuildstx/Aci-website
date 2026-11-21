import { json, readJson, HttpError } from '../../../lib/security.js';
import { galleryWithPhotoIds, validateGallery, parseGallery, GALLERY_DRAFT_ID, GALLERY_PUBLISHED_ID, GALLERY_REVISION } from '../../../lib/gallery.js';

const currentState = `
  SELECT id, payload, updated_at FROM gallery_state
  WHERE id IN (?1, ?2) ORDER BY CASE id WHEN ?1 THEN 0 ELSE 1 END LIMIT 1
`;

function version(row) {
  return row ? `${row.id}/${row.updated_at}` : null;
}

export async function onRequestGet({ env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const row = await env.ACI_DB.prepare(currentState).bind(GALLERY_DRAFT_ID, GALLERY_PUBLISHED_ID).first();
  return json(row
    ? { ...galleryWithPhotoIds(parseGallery(row.payload)), initialized: true, version: version(row) }
    : { categories: [], heroImage: null, initialized: false, version: null });
}

export async function onRequestPost({ request, env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const data = await readJson(request);
  if (data.revision !== GALLERY_REVISION) throw new HttpError(409, 'Reload the Owner Portal to load the current gallery before saving.');
  if (!['draft', 'publish'].includes(data.mode)) throw new HttpError(400, 'Invalid save mode.');
  const conflict = 'The gallery changed in another session. Reload the Owner Portal before saving.';
  const row = await env.ACI_DB.prepare(currentState).bind(GALLERY_DRAFT_ID, GALLERY_PUBLISHED_ID).first();
  if (data.version !== version(row)) throw new HttpError(409, conflict);
  const payload = JSON.stringify(galleryWithPhotoIds(validateGallery(data)));
  const now = new Date(Math.max(Date.now(), (Date.parse(row?.updated_at) || 0) + 1)).toISOString();
  // One conditional statement compares the loaded snapshot and writes draft and published rows atomically.
  const result = await env.ACI_DB.prepare(`
    WITH current AS MATERIALIZED (${currentState}),
    targets(id) AS (SELECT ?1 UNION ALL SELECT ?2 WHERE ?3 = 'publish')
    INSERT INTO gallery_state (id, payload, updated_at)
    SELECT id, ?4, ?5 FROM targets
    WHERE (SELECT id FROM current) IS ?6
      AND (SELECT updated_at FROM current) IS ?7
      AND (SELECT payload FROM current) IS ?8
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).bind(GALLERY_DRAFT_ID, GALLERY_PUBLISHED_ID, data.mode, payload, now,
    row?.id ?? null, row?.updated_at ?? null, row?.payload ?? null).run();
  if (!result.meta.changes) throw new HttpError(409, conflict);
  return json({ ok: true, mode: data.mode, version: version({ id: GALLERY_DRAFT_ID, updated_at: now }) });
}
