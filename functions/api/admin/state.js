import { json, readJson, HttpError } from '../../../lib/security.js';
import { validateGallery, parseGallery, GALLERY_DRAFT_ID, GALLERY_PUBLISHED_ID, GALLERY_REVISION } from '../../../lib/gallery.js';
export async function onRequestGet({ env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const row = await env.ACI_DB.prepare("SELECT payload FROM gallery_state WHERE id IN (?, ?) ORDER BY CASE id WHEN ? THEN 0 ELSE 1 END LIMIT 1").bind(GALLERY_DRAFT_ID, GALLERY_PUBLISHED_ID, GALLERY_DRAFT_ID).first();
  return json(row ? { ...parseGallery(row.payload), initialized: true } : { categories: [], heroImage: null, initialized: false });
}
export async function onRequestPost({ request, env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const data = await readJson(request);
  if (data.revision !== GALLERY_REVISION) throw new HttpError(409, "Reload the Owner Portal to load the current gallery before saving.");
  if (!['draft', 'publish'].includes(data.mode)) throw new HttpError(400, 'Invalid save mode.');
  const payload = JSON.stringify(validateGallery(data));
  const now = new Date().toISOString();
  const save = id => env.ACI_DB.prepare('INSERT INTO gallery_state (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(id, payload, now);
  await env.ACI_DB.batch(data.mode === 'publish' ? [save(GALLERY_DRAFT_ID), save(GALLERY_PUBLISHED_ID)] : [save(GALLERY_DRAFT_ID)]);
  return json({ ok: true, mode: data.mode });
}
