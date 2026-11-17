import { json, HttpError } from '../../lib/security.js';
import { parseGallery, publishedGallery } from '../../lib/gallery.js';
export async function onRequestGet({ env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const row = await env.ACI_DB.prepare("SELECT payload FROM gallery_state WHERE id = 'published'").first();
  return json(row ? { ...publishedGallery(parseGallery(row.payload)), initialized: true } : { categories: [], initialized: false });
}
