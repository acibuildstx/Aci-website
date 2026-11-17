import { checkOrigin, requireOwner, errorResponse } from '../lib/security.js';
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(context.request.method)) checkOrigin(context.request);
    if (/^\/admin(?:\.html)?\/?$/.test(path) || /^\/api\/admin(?:\/|$)/.test(path) || /^\/api\/media(?:\/|$)/.test(path)) {
      await requireOwner(context.request, context.env);
    }
    const response = await context.next();
    const result = new Response(response.body, response);
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Referrer-Policy', 'no-referrer');
    result.headers.set('X-Frame-Options', 'DENY');
    result.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if (path.startsWith('/api/') || path.startsWith('/admin')) result.headers.set('Cache-Control', 'no-store');
    return result;
  } catch (error) { return errorResponse(error); }
}
