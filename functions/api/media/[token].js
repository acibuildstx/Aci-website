import { HttpError } from '../../../lib/security.js';
export async function onRequestGet({ params, env }) {
  // Root middleware requires a verified, allowlisted owner Access JWT.
  if (!env.ACI_DB || !env.ACI_PRIVATE_BUCKET) throw new HttpError(503, 'Storage is not configured.');
  const token = String(params.token || '');
  if (!/^[a-f0-9]{32}$/.test(token)) throw new HttpError(404, 'Invalid media link.');
  const record = await env.ACI_DB.prepare('SELECT r2_key, original_name, content_type, expires_at FROM private_media_tokens WHERE token = ?').bind(token).first();
  if (!record) throw new HttpError(404, 'Invalid media link.');
  if (Math.floor(Date.now() / 1000) >= record.expires_at) throw new HttpError(410, 'This media link has expired.');
  const obj = await env.ACI_PRIVATE_BUCKET.get(record.r2_key);
  if (!obj) throw new HttpError(404, 'File not found.');
  return new Response(obj.body, { headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(record.original_name).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16))}`,
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
  } });
}
