import { createRemoteJWKSet, jwtVerify } from 'jose';
const keysets = new Map();
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
class PasswordSignInError extends HttpError {
  constructor() { super(401, 'Sign in with username owner and your owner password.'); }
}
export const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function checkOrigin(request) {
  const origin = request.headers.get('Origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    throw new HttpError(403, 'Cross-site requests are not allowed.');
  }
}
export async function requireOwner(request, env) {
  // An existing Access configuration always takes precedence. The password
  // option is opt-in through a secret and only used when Access is unconfigured.
  if (env.OWNER_PASSWORD && !env.ACCESS_ISSUER && !env.ACCESS_AUD && !env.OWNER_EMAILS) {
    return requireOwnerPassword(request, env);
  }
  const issuer = env.ACCESS_ISSUER?.replace(/\/$/, '');
  const audience = env.ACCESS_AUD;
  const owners = (env.OWNER_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  if (!issuer || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !audience || !owners.length) {
    throw new HttpError(503, 'Owner access is not configured.');
  }
  const cookie = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie;
  if (!token) throw new HttpError(401, 'Owner sign-in required.');
  try {
    if (!keysets.has(issuer)) keysets.set(issuer, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)));
    const { payload } = await jwtVerify(token, keysets.get(issuer), { issuer, audience: audience.split(',').map(v => v.trim()), algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'email'] });
    if (!owners.includes(String(payload.email).toLowerCase())) throw new Error('Owner not allowed');
    return payload;
  } catch { throw new HttpError(403, 'Owner access denied.'); }
}
async function requireOwnerPassword(request, env) {
  const password = env.OWNER_PASSWORD;
  if (typeof password !== 'string' || password.length < 16 || !env.ACI_DB) {
    throw new HttpError(503, 'Owner password access is not configured.');
  }
  if (new URL(request.url).protocol !== 'https:') throw new HttpError(403, 'Owner sign-in requires HTTPS.');
  const authorization = request.headers.get('Authorization');
  if (!authorization) throw new PasswordSignInError();

  // Share durable counters across requests using the existing D1 table.
  // Keep these separate from customer form counters and expire each window.
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const ipHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const bucket = `owner-login:${Math.floor(now / 900)}:${ipHash}`;
  const rate = await env.ACI_DB.prepare('SELECT attempts FROM inquiry_rate_limits WHERE bucket = ?').bind(bucket).first();
  if (rate?.attempts >= 10) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');

  let credentials = '';
  try {
    const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
    if (match && authorization.length <= 4096) {
      credentials = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(match[1]), c => c.charCodeAt(0)));
    }
  } catch { /* Invalid credentials receive the same challenge as a wrong password. */ }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  // Web Crypto verifies the complete credential without a JS string comparison.
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`owner:${password}`));
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(credentials));
  if (!valid) {
    await env.ACI_DB.prepare('INSERT INTO inquiry_rate_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1').bind(bucket, now + 1800).run();
    await env.ACI_DB.prepare('DELETE FROM inquiry_rate_limits WHERE expires_at < ?').bind(now).run();
    throw new PasswordSignInError();
  }
  return { sub: 'owner', authentication: 'password' };
}
export async function readBody(request, limit) {
  if (Number(request.headers.get('Content-Length')) > limit) throw new HttpError(413, 'Upload is too large. Maximum total request size is 30MB.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body is required.');
  const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new HttpError(413, 'Upload is too large. Maximum total request size is 30MB.'); }
    chunks.push(value);
  }
  return new Blob(chunks);
}
export async function readForm(request, limit = 31 * 1024 * 1024) {
  const body = await readBody(request, limit);
  try { return await new Response(body, { headers: { 'Content-Type': request.headers.get('Content-Type') || '' } }).formData(); }
  catch { throw new HttpError(400, 'Invalid form data.'); }
}
export async function readJson(request, limit = 800000) {
  const body = await readBody(request, limit);
  try { return JSON.parse(await body.text()); } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
export async function validateFile(file, { webpOnly = false, imageOnly = false } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size || file.size > 25 * 1024 * 1024) throw new HttpError(400, 'Files must be nonempty and no larger than 25MB.');
  const b = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const s = String.fromCharCode(...b);
  const t = file.type.toLowerCase();
  const webp = s.startsWith('RIFF') && s.slice(8, 12) === 'WEBP';
  const types = {
    'image/jpeg': b[0] === 255 && b[1] === 216 && b[2] === 255,
    'image/jpg': b[0] === 255 && b[1] === 216 && b[2] === 255,
    'image/png': s.startsWith('\x89PNG\r\n\x1a\n'),
    'image/webp': webp,
    'image/heic': s.slice(4, 8) === 'ftyp' && /heic|heix|hevc|hevx/.test(s.slice(8)),
    'image/heif': s.slice(4, 8) === 'ftyp' && /mif1|msf1|heic/.test(s.slice(8)),
    'video/mp4': s.slice(4, 8) === 'ftyp' && /isom|iso[2-9]|mp4[12]|avc1|M4V /.test(s.slice(8)),
    'video/quicktime': s.slice(4, 8) === 'ftyp' && s.slice(8).includes('qt  ')
  };
  if (!types[t] || (webpOnly && (t !== 'image/webp' || !webp)) || (imageOnly && !t.startsWith('image/'))) throw new HttpError(400, 'Unsupported or invalid media file. Use JPEG, PNG, WebP, HEIC/HEIF, MP4 or MOV.');
}
export function errorResponse(error) {
  // Never return database errors, provider responses, credentials, or customer details.
  const response = json({ error: error instanceof HttpError ? error.message : 'The operation could not be completed. Please try again or call ACI.' }, error instanceof HttpError ? error.status : 500);
  if (error instanceof PasswordSignInError) response.headers.set('WWW-Authenticate', 'Basic realm="ACI Owner", charset="UTF-8"');
  return response;
}
