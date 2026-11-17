import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { onRequest as middleware } from '../functions/_middleware.js';
import { onRequestPost as submit } from '../functions/api/submit-inquiry.js';
import { onRequestPost as save, onRequestGet as state } from '../functions/api/admin/state.js';
import { onRequestGet as gallery } from '../functions/api/gallery.js';
import { onRequestPost as upload } from '../functions/api/admin/upload.js';
import { onRequestGet as privateMedia } from '../functions/api/media/[token].js';
import { onRequestGet as publicMedia } from '../functions/api/public-media/[[path]].js';
import { GALLERY_REVISION } from '../lib/gallery.js';
import { requireOwner, validateFile } from '../lib/security.js';
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
function database() {
  const db = new DatabaseSync(':memory:'); db.exec(schema); db.exec(schema);
  function prepare(sql) { let values = []; return {
    bind(...v) { values = v; return this; },
    async first() { return db.prepare(sql).get(...values) || null; },
    async run() { db.prepare(sql).run(...values); return { success: true }; }
  }; }
  return { prepare, async batch(statements) { db.exec('BEGIN'); try { const r=[]; for (const s of statements) r.push(await s.run()); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } }, db };
}
function bucket() { const files = new Map(); return { files, async put(key, data) { files.set(key, await new Response(data).arrayBuffer()); }, async delete(key) { files.delete(key); }, async get(key) { return files.has(key) ? { body: files.get(key) } : null; } }; }
function env() { return { ACI_DB: database(), ACI_PRIVATE_BUCKET: bucket(), ACI_PUBLIC_BUCKET: bucket() }; }
function form(overrides = {}, files = []) { const f=new FormData(); for (const [k,v] of Object.entries({name:'Jane <b>Doe</b>',phone:'409-919-0038',email:'jane@example.com',location:'Galveston',service:'Repair',propertyType:'Residential',description:'Fix <script>bad()</script>',...overrides})) f.set(k,v); for (const file of files) f.append('files',file); return f; }
const request = (path, body, headers = {}) => new Request(`https://aci.test${path}`, { method: body ? 'POST' : 'GET', body, headers });
const run = (fn, request, env, params={}) => middleware({ request, env, next: () => fn({ request, env, params }) });
const image = () => new File([readFileSync(new URL('../public/photos/kitchens/kitchen-cover.webp', import.meta.url))], 'photo.webp', { type:'image/webp' });

test('owner routes fail closed with missing configuration or unsigned headers', async () => {
 for (const path of ['/admin','/admin/','/admin.html','/api/admin/state','/api/admin/upload','/api/media/'+'a'.repeat(32)]) {
  assert.equal((await run(() => new Response('secret'), request(path), {})).status,503);
  assert.equal((await run(() => new Response('secret'), request(path, null, {'Cf-Access-Authenticated-User-Email':'owner@example.com'}), {ACCESS_ISSUER:'https://test.cloudflareaccess.com',ACCESS_AUD:'app',OWNER_EMAILS:'owner@example.com'})).status,401);
 }
});
test('signed owner JWT: verifies signature, audience, expiry and owner allowlist; cookie works', async () => {
 const {publicKey,privateKey}=await generateKeyPair('RS256'); const jwk=await exportJWK(publicKey); jwk.kid='test-key'; jwk.alg='RS256';
 const original=globalThis.fetch; globalThis.fetch=async()=>Response.json({keys:[jwk]});
 const e={ACCESS_ISSUER:'https://jwt-test.cloudflareaccess.com',ACCESS_AUD:'app',OWNER_EMAILS:'owner@example.com'};
 async function token(email='owner@example.com',aud='app',expiry='2m') { return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setSubject('owner').setIssuedAt().setIssuer(e.ACCESS_ISSUER).setAudience(aud).setExpirationTime(expiry).sign(privateKey); }
 try {
  const good=await token(); assert.equal((await requireOwner(request('/admin',null,{'Cf-Access-Jwt-Assertion':good}),e)).email,'owner@example.com');
  assert.equal((await requireOwner(request('/api/public-media/draft',null,{Cookie:`CF_Authorization=${good}`}),e)).email,'owner@example.com');
  for (const bad of [await token('outsider@example.com'),await token('owner@example.com','wrong'),await token('owner@example.com','app','-1m'),good.slice(0,-5)+'AAAAA']) await assert.rejects(requireOwner(request('/admin',null,{'Cf-Access-Jwt-Assertion':bad}),e));
 } finally { globalThis.fetch=original; }
});
test('cross-origin mutations rejected before storage', async () => {
 const e=env(); const response=await run(submit,request('/api/submit-inquiry',form(),{Origin:'https://evil.test'}),e); assert.equal(response.status,403); assert.equal(e.ACI_DB.db.prepare('SELECT COUNT(*) n FROM inquiries').get().n,0);
});
test('submission saved with attachment when email is unconfigured; never claims delivery', async () => {
 const e=env(); const r=await run(submit,request('/api/submit-inquiry',form({},[image()])),e); const data=await r.json(); assert.equal(r.status,201); assert.equal(data.saved,true); assert.equal(data.notification,'failed'); assert.equal(e.ACI_DB.db.prepare('SELECT COUNT(*) n FROM inquiries').get().n,1); assert.equal(e.ACI_DB.db.prepare('SELECT COUNT(*) n FROM private_media_tokens').get().n,1); assert.equal(e.ACI_PRIVATE_BUCKET.files.size,1);
});
test('Resend rejection, timeout, invalid JSON and accepted response remain truthful; HTML escaped', async () => {
 const original=globalThis.fetch;
 try {
  for (const outcome of ['rejected','timeout','invalid','accepted']) {
   const e={...env(),RESEND_API_KEY:'test-only',FROM_EMAIL:'website@example.com',ADMIN_NOTIFY_EMAIL:'owner@example.com'};
   globalThis.fetch=async(url,opts)=>{assert.equal(url,'https://api.resend.com/emails');const body=JSON.parse(opts.body);assert.ok(body.html.includes('&lt;script&gt;'));assert.ok(!body.html.includes('<script>'));assert.equal(opts.headers['Idempotency-Key'].startsWith('inq_'),true); if(outcome==='timeout')throw new Error('secret provider error');if(outcome==='invalid')return new Response('invalid');return outcome==='accepted'?Response.json({id:'email-123'}):Response.json({message:'private provider error'},{status:422});};
   const r=await run(submit,request('/api/submit-inquiry',form()),e);const data=await r.json();assert.equal(r.status,201);assert.equal(data.notification,outcome==='accepted'?'accepted':'failed');assert.equal(e.ACI_DB.db.prepare('SELECT status FROM email_notifications').get().status,data.notification);assert.equal(JSON.stringify(data).includes('private provider'),false);
  }
 } finally {globalThis.fetch=original;}
});
test('all files validated before any upload; invalid fields and signatures rejected', async () => {
 const e=env();const fake=new File(['<html>bad</html>'],'bad.webp',{type:'image/webp'});
 assert.equal((await run(submit,request('/api/submit-inquiry',form({},[image(),fake])),e)).status,400);assert.equal(e.ACI_PRIVATE_BUCKET.files.size,0);
 assert.equal((await run(submit,request('/api/submit-inquiry',form({email:'invalid'})),e)).status,400);
 await assert.rejects(validateFile(new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'})));
 assert.equal((await run(submit,request('/api/submit-inquiry',form({},Array.from({length:6},image))),e)).status,400);
});
test('D1 failure cleans uploaded files; generic error hides internals', async () => {
 const e=env();e.ACI_DB.batch=async()=>{throw new Error('secret database credential');};
 const r=await run(submit,request('/api/submit-inquiry',form({},[image()])),e);assert.equal(r.status,500);assert.equal(e.ACI_PRIVATE_BUCKET.files.size,0);assert.equal((await r.text()).includes('secret'),false);
});
test('shared rate counter rejects attempt six', async () => {
 const e=env();for(let i=0;i<5;i++)assert.equal((await run(submit,request('/api/submit-inquiry',form()),e)).status,201);
 assert.equal((await run(submit,request('/api/submit-inquiry',form()),e)).status,429);
});
test('oversized body rejected before parsing', async () => {
 const r=await run(submit,request('/api/submit-inquiry','x',{'Content-Length':String(100*1024*1024)}),env());assert.equal(r.status,413);
});
const categories=[{slug:'kitchens',name:'Kitchen <img src=x onerror=bad()>',visible:true,photos:[{url:'photos/kitchens/kitchen-cover.webp',caption:'Quote " & <script>',is_cover:true}]},{slug:'hidden',name:'Hidden',visible:false,photos:[]}];
test('gallery draft isolated, publish atomic, hidden categories filtered, empty publication retained', async () => {
 const e=env();const post=mode=>save({env:e,request:request('/api/admin/state',JSON.stringify({revision:GALLERY_REVISION,mode,categories,heroImage:'photos/kitchens/kitchen-cover.webp'}))});
 await post('draft');assert.equal((await (await gallery({env:e})).json()).initialized,false);assert.equal((await (await state({env:e})).json()).categories.length,2);
 await post('publish');assert.equal((await (await gallery({env:e})).json()).categories.length,1);
 await save({env:e,request:request('/api/admin/state',JSON.stringify({revision:GALLERY_REVISION,mode:'publish',categories:[],heroImage:null}))});assert.deepEqual((await (await gallery({env:e})).json()).categories,[]);
 const bad=structuredClone(categories);bad[0].photos[0].url='javascript:alert(1)';await assert.rejects(save({env:e,request:request('/api/admin/state',JSON.stringify({revision:GALLERY_REVISION,mode:'publish',categories:bad,heroImage:null}))}));
});
test('legacy gallery rows and stale portal saves cannot override the reviewed gallery', async () => {
 const e = env();
 const insert = e.ACI_DB.db.prepare('INSERT INTO gallery_state (id, payload, updated_at) VALUES (?, ?, ?)');
 const legacy = JSON.stringify({ categories, heroImage: 'photos/kitchens/cover.webp' });
 insert.run('draft', legacy, '2026-01-01');
 insert.run('published', legacy, '2026-01-01');
 assert.equal((await (await gallery({ env: e })).json()).initialized, false);
 assert.equal((await (await state({ env: e })).json()).initialized, false);
 await assert.rejects(
  save({ env: e, request: request('/api/admin/state', JSON.stringify({ mode: 'publish', categories, heroImage: null })) }),
  error => error.status === 409
 );
 assert.equal(e.ACI_DB.db.prepare('SELECT COUNT(*) AS count FROM gallery_state').get().count, 2);
});
test('private attachment requires auth at middleware; expiry and unsafe names handled safely',async()=>{
 const e=env();await run(submit,request('/api/submit-inquiry',form({},[image()])),e);const row=e.ACI_DB.db.prepare('SELECT * FROM private_media_tokens').get();
 assert.equal((await run(privateMedia,request('/api/media/'+row.token),e,{token:row.token})).status,503);
 e.ACI_DB.db.prepare('UPDATE private_media_tokens SET original_name=?').run('bad"\r\nX-Evil:yes.webp');
 const response=await privateMedia({env:e,params:{token:row.token}});assert.equal(response.headers.get('Content-Type'),'application/octet-stream');assert.ok(response.headers.get('Content-Disposition').includes('%0D%0A'));assert.equal(response.headers.get('X-Evil'),null);
 e.ACI_DB.db.prepare('UPDATE private_media_tokens SET expires_at=0').run();await assert.rejects(privateMedia({env:e,params:{token:row.token}}),err=>err.status===410);
});
test('unpublished R2 photo denied; only published photo becomes public, originals never exposed',async()=>{
 const e=env();const key='portfolio/kitchens/abc.webp',url='/api/public-media/'+key;await e.ACI_PUBLIC_BUCKET.put(key,new Uint8Array([1,2]));
 await assert.rejects(publicMedia({env:e,request:request(url),params:{path:key}}),err=>err.status===503);
 const c=structuredClone(categories);c[0].photos[0].url=url;
 await save({env:e,request:request('/api/admin/state',JSON.stringify({revision:GALLERY_REVISION,mode:'publish',categories:c,heroImage:null}))});assert.equal((await publicMedia({env:e,request:request(url),params:{path:key}})).status,200);
 await assert.rejects(publicMedia({env:e,request:request(url),params:{path:'originals/private.jpg'}}),err=>err.status===404);
});
test('admin upload validates bytes and rolls back failed R2 write',async()=>{
 const e=env();const f=new FormData();f.set('webp',image());f.set('original',image());f.set('category','kitchens');e.ACI_PUBLIC_BUCKET.put=async()=>{throw new Error('R2 failed');};await assert.rejects(upload({env:e,request:request('/api/admin/upload',f)}));assert.equal(e.ACI_PRIVATE_BUCKET.files.size,0);
});
