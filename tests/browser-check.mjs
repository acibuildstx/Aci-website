import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
const base=process.env.ACI_TEST_URL || 'http://127.0.0.1:8788';
const browser=await chromium.launch({headless:true, executablePath:process.env.ACI_CHROMIUM_PATH});
const results=[];
try {
 const page=await browser.newPage({reducedMotion:'reduce'}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('.photo-card').first().waitFor();
 assert.equal(await page.locator('#activeCategoryTitle').textContent(), 'Property Maintenance');
 assert.equal(await page.locator('.gallery-tab[aria-selected="true"]').getAttribute('data-slug'), 'property-maintenance');
 assert.equal(await page.locator('#mobileCategorySelect').inputValue(), 'property-maintenance');
 const starterCategories = await page.evaluate(() => window.ACI_CONFIG.starterCategories);
 const maintenanceThumb = page.getByRole('button', {name:'Show Property Maintenance', exact:true});
 const flooringThumb = page.getByRole('button', {name:'Show Flooring', exact:true});
 const maintenanceImage = '/photos/property-maintenance/property-maintenance-01.webp';
 const heroImage = await page.evaluate(() => window.ACI_CONFIG.hero.heroImage);
 const featuredImage = page.locator('#featuredImage');
 assert.equal(await featuredImage.getAttribute('src'), maintenanceImage);
 assert.equal(await maintenanceThumb.locator('img').getAttribute('src'), maintenanceImage);
 for (const width of [1440, 390]) {
  await page.setViewportSize({width,height:900});
  await flooringThumb.click();
  assert.equal(await featuredImage.getAttribute('src'), await flooringThumb.locator('img').getAttribute('src'));
  await maintenanceThumb.click();
  assert.equal(await maintenanceThumb.getAttribute('aria-pressed'), 'true');
  assert.equal(await featuredImage.getAttribute('src'), maintenanceImage);
  assert.equal(await page.locator('#heroImg').getAttribute('src'), heroImage);
  assert.ok(await featuredImage.evaluate(img => img.decode().then(() => img.naturalWidth > 0)));
 }
 results.push('Property Maintenance uses the water heater in the slide and thumbnail at 1440px and 390px; hero retains its source');
 const requestLinks = page.locator('.service-request-link');
 assert.deepEqual((await requestLinks.allTextContents()).map(text => text.trim()), ['Request Repair','Request Remodel','Request Renovation']);
 assert.equal(await page.locator('.site-footer').getByText(/and rental services/i).count(), 0);
 assert.deepEqual(await page.locator('#primaryNav a').allTextContents(), ['Our Work','Services','About ACI','Contact']);
 for (const link of await page.locator('#primaryNav a, .pillars-nav-bar a').all()) {
  const href = await link.getAttribute('href');
  assert.equal(await page.locator(href).count(), 1);
 }
 assert.equal(await page.getByRole('link', { name: 'Owner Portal' }).getAttribute('href'), '/admin.html');
 assert.equal(await page.getByRole('link', { name: '409-919-0038', exact: true }).last().getAttribute('href'), 'tel:4099190038');
 for (const width of [320,360,390,720,768,960,1024,1440]) {
  await page.setViewportSize({width,height:900});await page.waitForTimeout(80);
  const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(overflow.scroll<=width,`Overflow at ${width}: ${JSON.stringify(overflow)}`);
  for (const link of await requestLinks.all()) {
   assert.ok(await link.evaluate(el => el.offsetHeight >= 44 && el.offsetWidth < el.parentElement.clientWidth));
  }
  assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete && !i.naturalWidth).length),0);
  if(width===390){await page.locator('#mobileMenuBtn').click();assert.equal(await page.locator('#mobileMenuBtn').getAttribute('aria-expanded'),'true');await page.locator('#primaryNav a[href="#contact"]').click();assert.equal(await page.locator('#mobileMenuBtn').getAttribute('aria-expanded'),'false');}
  results.push(`Homepage ${width}px: no horizontal overflow or broken loaded images`);
 }
 await page.setViewportSize({width:390,height:900});
 await page.locator('#mobileCategorySelect').selectOption('flooring');
 assert.equal(await page.locator('#activeCategoryTitle').textContent(), 'Flooring');
 await page.locator('#mobileCategorySelect').selectOption('tile');
 assert.equal(await page.locator('#activeCategoryTitle').textContent(), 'Tile Work');
 await page.setViewportSize({width:1440,height:900});
 const categoryCount = await page.locator(".gallery-tab").count();
 assert.equal(categoryCount, 14);
 const photoLimits = {'property-maintenance':8,flooring:10,tile:10,renovations:7};
 for (const tab of await page.locator('.gallery-tab').all()) {
  const slug = await tab.getAttribute('data-slug');
  await tab.click();
  const photos = starterCategories.find(category => category.slug === slug).photos;
  const expected = photos.slice(0, photoLimits[slug] ?? 5).map(photo => '/' + photo.url);
  assert.deepEqual(await page.locator('.photo-card img').evaluateAll(imgs => imgs.map(img => img.getAttribute('src'))), expected);
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.photo-card img')).every(img => img.complete && img.naturalWidth));
 }
 await page.locator('.photo-card').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#lightbox').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#lightbox').isVisible(),false);
 results.push('All 14 visible starter categories load; keyboard lightbox opens and closes');
 // Test untrusted stored content through mocked gallery API; no account or remote write.
 const c={slug:'test',name:'<img src=x onerror=alert(1)>',visible:true,photos:[{url:'photos/kitchens/kitchen-cover.webp',caption:'" onerror="alert(1)',before_url:'photos/kitchens/kitchen-02.webp'}]};
 await page.route('**/api/gallery',r=>r.fulfill({json:{initialized:true,categories:[c],heroImage:null}}));await page.reload();await page.locator('.photo-card').waitFor();assert.equal(await page.locator('#galleryTabs img').count(),0);assert.equal(await page.locator('.photo-card img').getAttribute('onerror'),null);await page.locator('.photo-card').click();assert.equal(await page.locator('.ba-pane').count(),2);await page.keyboard.press('Escape');
 results.push('Stored HTML and attribute injection escaped; before/after lightbox works');
 await page.route('**/api/gallery',r=>r.fulfill({json:{initialized:true,categories:[],heroImage:null}}));await page.reload();await page.waitForTimeout(100);assert.equal(await page.locator('.gallery-tab').count(),0);assert.equal(await page.locator('.photo-card').count(),0);results.push('Empty published gallery does not resurrect starter photos');
 await page.locator('#custName').fill('Test Customer');await page.locator('#custPhone').fill('4099190038');await page.locator('#custEmail').fill('test@example.com');await page.locator('#custLocation').fill('Galveston');await page.locator('#projectDesc').fill('Test only');
 await page.route('**/api/submit-inquiry',r=>r.fulfill({status:201,json:{saved:true,notification:'failed',inquiryId:'test-reference'}}));await page.locator('#submitBtn').click();await page.locator('#formFeedback').waitFor();assert.ok((await page.locator('#formFeedback').textContent()).includes('notification failed'));assert.ok(!(await page.locator('#formFeedback').textContent()).includes('securely sent'));results.push('Saved request with failed email shows accurate warning and reference');
 await requestLinks.last().click();
 assert.equal(await page.locator('#serviceType').inputValue(), 'Renovate');
 await page.locator('#custName').fill('Test Customer');
 await page.locator('#custPhone').fill('4099190038');
 await page.locator('#custEmail').fill('test@example.com');
 await page.locator('#custLocation').fill('Galveston');
 await page.locator('#projectDesc').fill('Test only');
 await page.route('**/api/submit-inquiry', r => r.fulfill({status:201,json:{saved:true,notification:'accepted'}}));
 await page.locator('#submitBtn').click();
 await page.locator('#formFeedback').waitFor();
 assert.equal(await page.locator('#formFeedback').textContent(), 'Email sent.');
 results.push('Service request preset and accepted email copy verified with a mocked API');
 const response=await page.request.get(base+'/api/admin/state');assert.equal(response.status(),503);for(const path of ['/admin','/admin.html','/admin/'])assert.equal((await page.request.get(base+path)).status(),503);results.push('Real Pages local runtime blocks unconfigured admin aliases and API');
 // Owner UI tested with mocked auth-protected responses, not a real Cloudflare login.
 await page.route('**/admin.html',r=>r.fulfill({contentType:'text/html',body:readFileSync(new URL('../public/admin.html',import.meta.url),'utf8')}));
 const starter=[{slug:'kitchens',name:'Kitchen " <b>test</b>',visible:true,photos:[{id:'cover',url:'photos/kitchens/kitchen-cover.webp',caption:'" onfocus="bad()',is_cover:true, before_url:'photos/kitchens/kitchen-03.webp'},{id:'second',url:'photos/kitchens/kitchen-02.webp',caption:'Second'}]},{slug:'elsewhere',name:'Elsewhere',visible:true,photos:[]}];
 let saved, conflict = false, saveCount = 0;
 await page.route('**/api/admin/state',async r=>{
  if (r.request().method()==='POST') {
   saved=r.request().postDataJSON();
   if (conflict) return r.fulfill({status:409,json:{error:'The gallery changed in another session.'}});
   return r.fulfill({json:{ok:true,version:`version-${++saveCount}`}});
  }
  return r.fulfill({json:{initialized:true,version:'initial',categories:starter,heroImage:'photos/kitchens/kitchen-cover.webp'}});
 });
 await page.goto(base+'/admin.html');await page.locator('.photo-admin-card').first().waitFor();assert.equal(await page.locator('[data-cap-idx="0"]').getAttribute('onfocus'),null);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Admin overflow ${width}`);}
 await page.locator('[data-move-p="1"]').first().click();await page.locator('#saveDraftBtn').click();await page.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Draft Saved'));assert.equal(saved.categories[0].photos[0].caption,'Second');
 await page.locator('[data-cover="1"]').click();await page.locator('[data-hero="0"]').click();await page.locator('#publishLiveBtn').click();await page.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Published Live'));assert.equal(saved.mode,'publish');assert.equal(saved.revision,'owner-photos-v2');assert.equal(saved.heroImage,'photos/kitchens/kitchen-cover.webp');assert.equal(saved.categories[0].photos[0].is_cover,true);
 results.push('Owner UI: 320–1440px, escaped captions, reordering, covers, hero and publishing payload verified with mocked API');
 await page.route('**/api/admin/upload',r=>r.fulfill({status:503,json:{error:'Upload failed for test'}}));await page.locator('#adminUploadInput').setInputFiles(new URL('../public/photos/kitchens/kitchen-cover.webp',import.meta.url).pathname);await page.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Upload failed'));assert.equal(await page.locator('.photo-admin-card').count(),2);results.push('Failed owner upload reports failure and adds no browser-only image');
 const photoFile = new URL('../public/photos/kitchens/kitchen-03.webp',import.meta.url).pathname;
 const status = page.locator('#adminStatus');
 const saveDraft = async () => {
  await page.locator('#saveDraftBtn').click();
  await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('Draft Saved'));
  return saved.categories[0].photos;
 };
 const openPhoto = async selector => {
  const chooser = page.waitForEvent('filechooser');
  await page.locator(selector).click();
  await (await chooser).setFiles(photoFile);
  await page.locator('#photoChangeDialog').waitFor();
 };
 const confirmPhoto = () => page.locator('#confirmPhotoChange').click();
 const pendingUpload = async () => {
  let complete;
  let started;
  const request = new Promise(resolve => { started = resolve; });
  await page.route('**/api/admin/upload', route => new Promise(resolve => {
   complete = async response => { await route.fulfill(response); resolve(); };
   started();
  }), { times: 1 });
  return { request, finish: response => complete(response) };
 };
 const mediaUrl = name => `/api/public-media/portfolio/kitchens/${name}.webp`;
 await openPhoto('[data-replace="second"]');
 assert.ok((await page.locator('#replacementPhotoPreview img').getAttribute('src')).startsWith('blob:'));
 assert.match(await page.locator('#currentPhotoPreview img').getAttribute('src'), /kitchen-02/);
 const replacement = await pendingUpload();
 await confirmPhoto();
 await replacement.request;
 assert.equal(await page.locator('#saveDraftBtn').isDisabled(),true);
 await page.locator('[data-move-p="-1"][data-pidx="1"]').click();
 await replacement.finish({json:{ok:true,publicUrl:mediaUrl('replacement')}});
 await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('Photo replaced'));
 assert.equal(await page.locator('#publishLiveBtn').isDisabled(),true);
 let photos = await saveDraft();
 assert.deepEqual(photos.map(photo=>photo.id), ['second','cover']);
 assert.deepEqual(photos[0], {...starter[0].photos[1],url:mediaUrl('replacement'),previous_url:starter[0].photos[1].url,is_cover:false});
 assert.deepEqual(photos[1],starter[0].photos[0]);

 await openPhoto('[data-replace="cover"]');
 const cover = await pendingUpload();
 await confirmPhoto();
 await cover.request;
 await cover.finish({json:{ok:true,publicUrl:mediaUrl('cover-replacement')}});
 await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('Photo replaced'));
 photos = await saveDraft();
 assert.deepEqual(photos[1],{...starter[0].photos[0],url:mediaUrl('cover-replacement'),previous_url:starter[0].photos[0].url});
 assert.equal(saved.heroImage,starter[0].photos[0].url);
 await page.locator('[data-restore-photo="cover"]').click();
 await confirmPhoto();
 photos = await saveDraft();
 assert.equal(photos[1].url,starter[0].photos[0].url);
 assert.equal(photos[1].previous_url,mediaUrl('cover-replacement'));

 await openPhoto('[data-ba="cover"]');
 const before = await pendingUpload();
 await confirmPhoto();
 await before.request;
 await page.locator('[data-move-p="-1"][data-pidx="1"]').click();
 await before.finish({json:{ok:true,publicUrl:mediaUrl('before')}});
 await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('Before photo linked'));
 photos = await saveDraft();
 assert.equal(photos[0].id,'cover');
 assert.equal(photos[0].before_url,mediaUrl('before'));
 assert.equal(photos[1].before_url,undefined);

 await openPhoto('[data-replace="second"]');
 await confirmPhoto();
 await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('Upload failed'));
 assert.equal(await page.locator('[data-replace="second"]').locator('xpath=ancestor::div[contains(@class,"photo-admin-card")]').locator('img').getAttribute('src'),mediaUrl('replacement'));

 await page.locator('[data-move-photo="second"]').click();
 await page.locator('#photoDestination').selectOption('elsewhere');
 await confirmPhoto();
 photos = await saveDraft();
 assert.deepEqual(photos.map(photo=>photo.id),['cover']);
 assert.equal(saved.categories[1].photos[0].id,'second');
 assert.equal(saved.categories[1].photos[0].url,mediaUrl('replacement'));

 await openPhoto('[data-ba="cover"]');
 const removed = await pendingUpload();
 await confirmPhoto();
 await removed.request;
 page.once('dialog',event=>event.accept());
 await page.locator('[data-del="0"]').click();
 await removed.finish({json:{ok:true,publicUrl:mediaUrl('unused')}});
 await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('No photo was updated'));
 assert.equal(await page.locator('.photo-admin-card').count(),0);
 conflict = true;
 await page.locator('#saveDraftBtn').click();
 await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('another session'));
 assert.ok((await status.textContent()).includes('changed'));
 results.push('Photo replacement, preview, draft gate, cover metadata, rollback, reorder, category move, removal, failed upload and save conflict verified');
 assert.deepEqual(errors,[]);results.push('No uncaught browser JavaScript errors');console.log(results.join('\n'));
} finally {await browser.close();}
