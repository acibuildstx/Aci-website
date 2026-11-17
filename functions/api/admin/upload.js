import { json, readForm, validateFile, HttpError } from '../../../lib/security.js';
export async function onRequestPost({ request, env }) {
  if (!env.ACI_PUBLIC_BUCKET || !env.ACI_PRIVATE_BUCKET) throw new HttpError(503, 'Photo storage is not configured.');
  const fd = await readForm(request, 31 * 1024 * 1024);
  const webp = fd.get('webp'), original = fd.get('original');
  const category = String(fd.get('category') || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) || category.length > 80) throw new HttpError(400, 'Invalid category.');
  await validateFile(webp, { webpOnly: true });
  await validateFile(original, { imageOnly: true });
  if (webp.size + original.size > 30 * 1024 * 1024) throw new HttpError(413, 'Optimized image and original must total no more than 30MB.');
  const stamp = crypto.randomUUID();
  const publicKey = `portfolio/${category}/${stamp}.webp`;
  const backupKey = `originals/${category}/${stamp}-${original.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120)}`;
  try {
    await env.ACI_PRIVATE_BUCKET.put(backupKey, original.stream(), { httpMetadata: { contentType: original.type } });
    await env.ACI_PUBLIC_BUCKET.put(publicKey, webp.stream(), { httpMetadata: { contentType: 'image/webp' } });
  } catch (error) {
    await Promise.allSettled([env.ACI_PRIVATE_BUCKET.delete(backupKey), env.ACI_PUBLIC_BUCKET.delete(publicKey)]);
    throw error;
  }
  return json({ ok: true, publicUrl: `/api/public-media/${publicKey}` });
}
