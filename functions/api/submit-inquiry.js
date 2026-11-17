import { json, readForm, validateFile, escapeHtml, HttpError } from '../../lib/security.js';
export async function onRequestPost({ request, env }) {
  if (!env.ACI_DB || !env.ACI_PRIVATE_BUCKET) throw new HttpError(503, 'Service requests are temporarily unavailable. Please call 409-919-0038.');
  // A shared D1 counter works across isolates; never store the raw customer IP.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)))).map(v => v.toString(16).padStart(2, '0')).join('');
  const bucket = `${Math.floor(nowSeconds / 600)}:${hash}`;
  const rate = await env.ACI_DB.prepare('INSERT INTO inquiry_rate_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(bucket, nowSeconds + 1200).first();
  if (rate.attempts > 5) throw new HttpError(429, 'Too many requests. Please wait ten minutes or call ACI.');
  await env.ACI_DB.prepare('DELETE FROM inquiry_rate_limits WHERE expires_at < ?').bind(nowSeconds).run();
  const fd = await readForm(request);
  if (fd.get('website_url')) throw new HttpError(400, 'Unable to accept this request. Please call ACI.');
  const fields = {};
  const limits = { name: 150, phone: 40, email: 254, location: 200, service: 50, propertyType: 50, description: 10000 };
  for (const [key, max] of Object.entries(limits)) {
    fields[key] = String(fd.get(key) || '').trim();
    if (!fields[key] || fields[key].length > max) throw new HttpError(400, `Please provide a valid ${key}.`);
  }
  const { name, phone, email, location, service, propertyType, description } = fields;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !/^[+\d\s().-]{7,40}$/.test(phone) || phone.replace(/\D/g, '').length < 7) throw new HttpError(400, 'Please provide a valid phone number and email address.');
  if (!['Repair','Remodel','Renovate','Property Maintenance & Rental Services','Property Management','Other'].includes(service) || !['Residential','Commercial','Rental / Managed Property'].includes(propertyType)) throw new HttpError(400, 'Please select a valid service and property type.');
  const files = fd.getAll('files').filter(f => typeof f !== 'string' && f.size > 0);
  if (files.length > 5) throw new HttpError(400, 'Maximum 5 attachments allowed.');
  if (files.reduce((n, f) => n + f.size, 0) > 30 * 1024 * 1024) throw new HttpError(413, 'Please keep all attachments together below 30MB.');
  for (const file of files) await validateFile(file);
  const inquiryId = `inq_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const expiresAt = nowSeconds + 14 * 86400;
  const media = files.map(file => {
    const token = crypto.randomUUID().replace(/-/g, '');
    return { file, token, key: `customer-submissions/${inquiryId}/${token}`, url: `${new URL(request.url).origin}/api/media/${token}` };
  });
  try {
    for (const m of media) await env.ACI_PRIVATE_BUCKET.put(m.key, m.file.stream(), { httpMetadata: { contentType: m.file.type }, customMetadata: { inquiryId } });
    await env.ACI_DB.batch([
      env.ACI_DB.prepare('INSERT INTO inquiries (id, name, phone, email, location, service, property_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(inquiryId, name, phone, email, location, service, propertyType, description, now),
      ...media.map(m => env.ACI_DB.prepare('INSERT INTO private_media_tokens (token, inquiry_id, r2_key, original_name, content_type, expires_at) VALUES (?, ?, ?, ?, ?, ?)').bind(m.token, inquiryId, m.key, m.file.name.slice(0, 255), m.file.type, expiresAt)),
      env.ACI_DB.prepare("INSERT INTO email_notifications (inquiry_id, status, updated_at) VALUES (?, 'pending', ?)").bind(inquiryId, now)
    ]);
  } catch (error) {
    await Promise.allSettled(media.map(m => env.ACI_PRIVATE_BUCKET.delete(m.key)));
    throw error;
  }
  // Storage has succeeded. Never ask customers to repeat a saved request because email failed.
  let notification = 'failed'; let providerId = null;
  if (env.RESEND_API_KEY && env.FROM_EMAIL && env.FROM_EMAIL !== 'onboarding@resend.dev' && env.ADMIN_NOTIFY_EMAIL) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': inquiryId },
        body: JSON.stringify({
          from: `ACI Website <${env.FROM_EMAIL}>`, to: [env.ADMIN_NOTIFY_EMAIL], reply_to: email,
          subject: `New ACI Service Request: ${service} — ${name} (${location})`.replace(/[\r\n]/g, ' '),
          html: `<h2>New Service Request — Absolute Custom Installations</h2><p>Reference: ${inquiryId}</p>${Object.entries(fields).map(([key, value]) => `<p><strong>${key}:</strong> ${escapeHtml(value).replace(/\n/g, '<br/>')}</p>`).join('')}<h3>Attachments (owner sign-in required; links expire in 14 days)</h3><ul>${media.map(m => `<li><a href="${escapeHtml(m.url)}">${escapeHtml(m.file.name)}</a></li>`).join('')}</ul>`
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (typeof data.id === 'string' && data.id) { notification = 'accepted'; providerId = data.id; }
      }
    } catch { /* A provider failure must not erase the saved customer request. */ }
  }
  try {
    await env.ACI_DB.prepare('UPDATE email_notifications SET status = ?, provider_id = ?, updated_at = ? WHERE inquiry_id = ?').bind(notification, providerId, new Date().toISOString(), inquiryId).run();
  } catch { notification = 'unknown'; }
  return json({ ok: true, saved: true, inquiryId, filesUploaded: media.length, notification }, 201);
}
