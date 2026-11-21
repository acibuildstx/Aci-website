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
 const starter=[{slug:'kitchens',name:'Kitchen " <b>test</b>',visible:true,photos:[{url:'photos/kitchens/kitchen-cover.webp',caption:'" onfocus="bad()',is_cover:true},{url:'photos/kitchens/kitchen-02.webp',caption:'Second'}]}];
 let saved;
 await page.route('**/api/admin/state',async r=>{if(r.request().method()==='POST'){saved=r.request().postDataJSON();await r.fulfill({json:{ok:true}});}else await r.fulfill({json:{initialized:true,categories:starter,heroImage:'photos/kitchens/kitchen-cover.webp'}});});
 await page.goto(base+'/admin.html');await page.locator('.photo-admin-card').first().waitFor();assert.equal(await page.locator('[data-cap-idx="0"]').getAttribute('onfocus'),null);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Admin overflow ${width}`);}
 await page.locator('[data-move-p="1"]').first().click();await page.locator('#saveDraftBtn').click();await page.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Draft Saved'));assert.equal(saved.categories[0].photos[0].caption,'Second');
 await page.locator('[data-cover="1"]').click();await page.locator('[data-hero="0"]').click();await page.locator('#publishLiveBtn').click();await page.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Published Live'));assert.equal(saved.mode,'publish');assert.equal(saved.revision,'owner-photos-v2');assert.equal(saved.heroImage,'photos/kitchens/kitchen-cover.webp');assert.equal(saved.categories[0].photos[0].is_cover,true);
 results.push('Owner UI: 320–1440px, escaped captions, reordering, covers, hero and publishing payload verified with mocked API');
 await page.route('**/api/admin/upload',r=>r.fulfill({status:503,json:{error:'Upload failed for test'}}));await page.locator('#adminUploadInput').setInputFiles(new URL('../public/photos/kitchens/kitchen-cover.webp',import.meta.url).pathname);await page.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Upload failed'));assert.equal(await page.locator('.photo-admin-card').count(),2);results.push('Failed owner upload reports failure and adds no browser-only image');
 assert.deepEqual(errors,[]);results.push('No uncaught browser JavaScript errors');console.log(results.join('\n'));
} finally {await browser.close();}
