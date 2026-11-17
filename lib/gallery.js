import { HttpError } from './security.js';
export function mediaPath(value) {
  if (typeof value !== 'string' || value.length > 300) return false;
  return /^\/?photos\/[a-z0-9-]+\/[a-zA-Z0-9._-]+\.webp$/.test(value) || /^\/api\/public-media\/portfolio\/[a-z0-9-]+\/[a-zA-Z0-9-]+\.webp$/.test(value);
}
export function validateGallery({ categories, heroImage }) {
  if (!Array.isArray(categories) || categories.length > 50 || (heroImage !== null && !mediaPath(heroImage))) throw new HttpError(400, 'Invalid gallery or hero image.');
  const slugs = new Set();
  let count = 0;
  for (const cat of categories) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cat.slug) || cat.slug.length > 80 || slugs.has(cat.slug) || typeof cat.name !== 'string' || !cat.name.trim() || cat.name.length > 100 || typeof cat.visible !== 'boolean' || !Array.isArray(cat.photos)) throw new HttpError(400, 'Invalid or duplicate gallery category.');
    slugs.add(cat.slug);
    for (const photo of cat.photos) {
      if (++count > 1000 || !mediaPath(photo.url) || (photo.before_url && !mediaPath(photo.before_url)) || typeof photo.caption !== 'string' || photo.caption.length > 300) throw new HttpError(400, 'Invalid gallery photograph.');
    }
  }
  return { categories, heroImage };
}
export function parseGallery(payload) {
  const data = JSON.parse(payload);
  return Array.isArray(data) ? { categories: data, heroImage: null } : data;
}
export function publishedGallery(data) {
  return { categories: data.categories.filter(c => c.visible), heroImage: data.heroImage || null };
}
