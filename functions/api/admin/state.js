import { json, readJson, HttpError } from '../../../lib/security.js';
import { validateGallery, parseGallery } from '../../../lib/gallery.js';
export async function onRequestGet({ env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const row = await env.ACI_DB.prepare("SELECT payload FROM gallery_state WHERE id IN ('draft', 'published') ORDER BY CASE id WHEN 'draft' THEN 0 ELSE 1 END LIMIT 1").first();
  return json(row ? { ...parseGallery(row.payload), initialized: true } : { categories: [], heroImage: null, initialized: false });
}
export async function onRequestPost({ request, env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const data = await readJson(request);
  if (!['draft', 'publish'].includes(data.mode)) throw new HttpError(400, 'Invalid save mode.');
  const payload = JSON.stringify(validateGallery(data));
  const now = new Date().toISOString();
  const save = id => env.ACI_DB.prepare('INSERT INTO gallery_state (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(id, payload, now);
  await env.ACI_DB.batch(data.mode === 'publish' ? [save('draft'), save('published')] : [save('draft')]);
  return json({ ok: true, mode: data.mode });
}
