import { requireOwner, HttpError } from '../../../lib/security.js';
import { parseGallery, publishedGallery, GALLERY_PUBLISHED_ID } from '../../../lib/gallery.js';
export async function onRequestGet({ request, params, env }) {
  if (!env.ACI_PUBLIC_BUCKET || !env.ACI_DB) throw new HttpError(503, 'Gallery storage is not configured.');
  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!/^portfolio\/[a-z0-9-]+\/[a-zA-Z0-9-]+\.webp$/.test(key)) throw new HttpError(404, 'Image not found.');
  const row = await env.ACI_DB.prepare("SELECT payload FROM gallery_state WHERE id = ?").bind(GALLERY_PUBLISHED_ID).first();
  const data = row ? publishedGallery(parseGallery(row.payload)) : { categories: [] };
  const url = `/api/public-media/${key}`;
  const visible = data.heroImage === url || data.categories.some(c => c.photos.some(p => p.url === url || p.before_url === url));
  if (!visible) await requireOwner(request, env);
  const obj = await env.ACI_PUBLIC_BUCKET.get(key);
  if (!obj) throw new HttpError(404, 'Image not found.');
  return new Response(obj.body, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' } });
}
