import { json, HttpError } from '../../lib/security.js';
import { parseGallery, publishedGallery, GALLERY_PUBLISHED_ID } from '../../lib/gallery.js';
export async function onRequestGet({ env }) {
  if (!env.ACI_DB) throw new HttpError(503, 'Gallery database is not configured.');
  const row = await env.ACI_DB.prepare("SELECT payload FROM gallery_state WHERE id = ?").bind(GALLERY_PUBLISHED_ID).first();
  if (!row) return json({ categories: [], initialized: false });
  const data = publishedGallery(parseGallery(row.payload));
  const categories = data.categories.map(category => ({
    ...category,
    photos: category.photos.map(({ previous_url, ...photo }) => photo)
  }));
  return json({ ...data, categories, initialized: true });
}
