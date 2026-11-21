(function () {
  const cfg = window.ACI_CONFIG;
  const esc = window.ACI_UI.escape;
  let categories = [];
  let activeSlug = "property-maintenance";
  let featuredTimer;
  let featuredIndex = 0;
  const featuredOrder = ["property-maintenance", "flooring", "tile", "painting", "carpentry", "fences", "decks", "kitchens", "bathrooms"];
  let selectedFiles = [];
  let lastFocus;
  function closeLightbox() { document.getElementById("lightbox").hidden = true; lastFocus?.focus(); }

  function resolveMediaUrl(path) {
    return window.ACI_UI.media(path);
  }

  function renderStaticSections() {
    const heroImg = document.getElementById("heroImg");
    if (heroImg && cfg.hero.heroImage) {
      heroImg.src = resolveMediaUrl(cfg.hero.heroImage);
    }
    const heroCap = document.getElementById("heroCaption");
    if (heroCap && cfg.hero.heroCaption) {
      heroCap.textContent = cfg.hero.heroCaption;
    }

    const triad = document.getElementById("servicesTriad");
    triad.innerHTML = cfg.principalServices.map(svc => `
      <article class="service-card" id="svc-${svc.id}">
        <div>
          <span class="service-code">${svc.code}</span>
          <h3>${svc.title}</h3>
          <p class="service-sub">${svc.subtitle}</p>
          <p class="service-desc">${svc.description}</p>
          <ul class="service-list">
            ${svc.highlights.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </div>
        <a href="#contact" class="btn btn-outline-gold btn-sm service-request-link" data-preset-service="${svc.title.charAt(0) + svc.title.slice(1).toLowerCase()}">
          Request ${svc.id === "renovate" ? "Renovation" : svc.title.charAt(0) + svc.title.slice(1).toLowerCase()}
        </a>
      </article>
    `).join("");

    document.getElementById("pmTitle").textContent = cfg.propertyManagement.title;
    document.getElementById("pmBody").textContent = cfg.propertyManagement.body;
    document.getElementById("pmTagline").textContent = cfg.propertyManagement.tagline;

    document.getElementById("aboutBody").textContent = cfg.about.body;
    document.getElementById("aboutPillars").innerHTML = cfg.about.pillars.map(p => `
      <div class="pillar-card">
        <h3>${p.label}</h3>
        <p>${p.detail}</p>
      </div>
    `).join("");
  }

  async function loadGalleryData() {
    let initialized = false;
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.initialized === true) {
          initialized = true;
          categories = data.categories.filter(c => c.visible && c.photos?.length);
          // The featured maintenance-first carousel owns the hero image.
        }
      }
    } catch (_) {
      // Fallback to starter config if D1 is not yet bound
    }
    if (!initialized) {
      categories = cfg.starterCategories.filter(c => c.visible && c.photos.length);
    }
    categories.sort((a, b) => {
      const rank = slug => featuredOrder.indexOf(slug) < 0 ? 100 : featuredOrder.indexOf(slug);
      return rank(a.slug) - rank(b.slug) || (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    if (categories.length && !categories.some(c => c.slug === activeSlug)) {
      activeSlug = categories[0].slug;
    }
    renderGalleryControls();
    renderActiveCategory();
    setupFeaturedCarousel();
  }

  function setupFeaturedCarousel() {
    const viewport = document.getElementById("featuredImage");
    const thumbs = document.getElementById("featuredThumbs");
    const caption = document.getElementById("featuredCaption");
    const featured = categories.filter(c => c.photos?.length).slice(0, 9);
    if (!viewport || !thumbs || !featured.length) return;
    clearInterval(featuredTimer);
    featuredIndex = 0;
    function show(i) {
      featuredIndex = (i + featured.length) % featured.length;
      const cat = featured[featuredIndex];
      const photo = cat.photos.find(p => p.is_cover) || cat.photos[0];
      const url = resolveMediaUrl(cat.slug === "property-maintenance" ? cfg.hero.heroImage : photo.url);
      viewport.src = url;
      viewport.alt = `${cat.name} project by Absolute Custom Installations`;
      caption.textContent = cat.name;
      document.getElementById("featuredGalleryLink").href = `#portfolio`;
      thumbs.querySelectorAll("button").forEach((btn, index) => {
        btn.setAttribute("aria-pressed", String(index === featuredIndex));
      });
      const hero = document.getElementById("heroImg");
      if (hero && featuredIndex === 0) hero.src = resolveMediaUrl(cfg.hero.heroImage);
    }
    const restart = () => {
      clearInterval(featuredTimer);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        featuredTimer = setInterval(() => show(featuredIndex + 1), 5500);
      }
    };
    thumbs.innerHTML = featured.map((cat, index) => {
      const photo = cat.photos.find(p => p.is_cover) || cat.photos[0];
      return `<button type="button" class="featured-thumb" data-index="${index}" aria-label="Show ${esc(cat.name)}" aria-pressed="false"><img src="${esc(resolveMediaUrl(cat.slug === "property-maintenance" ? cfg.hero.heroImage : photo.url))}" alt="" loading="lazy"><span>${esc(cat.name)}</span></button>`;
    }).join("");
    thumbs.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
      show(Number(btn.dataset.index)); restart();
    }));
    document.getElementById("featuredGalleryLink").addEventListener("click", () => {
      activeSlug = featured[featuredIndex].slug;
      renderGalleryControls(); renderActiveCategory();
    });
    show(0); restart();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearInterval(featuredTimer); else restart();
    });
  }

  function renderGalleryControls() {
    const tabsEl = document.getElementById("galleryTabs");
    const selectEl = document.getElementById("mobileCategorySelect");

    tabsEl.innerHTML = categories.map(cat => `
      <button
        type="button"
        class="gallery-tab"
        role="tab"
        aria-selected="${cat.slug === activeSlug}"
        data-slug="${esc(cat.slug)}">
        ${esc(cat.name)}
      </button>
    `).join("");

    selectEl.innerHTML = categories.map(cat => `
      <option value="${esc(cat.slug)}" ${cat.slug === activeSlug ? "selected" : ""}>${esc(cat.name)}</option>
    `).join("");

    tabsEl.querySelectorAll(".gallery-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        activeSlug = btn.dataset.slug;
        renderGalleryControls();
        renderActiveCategory();
      });
    });

    selectEl.onchange = (e) => {
      activeSlug = e.target.value;
      renderGalleryControls();
      renderActiveCategory();
    };
  }

  function renderActiveCategory() {
    const cat = categories.find(c => c.slug === activeSlug);
    if (!cat) {
      document.getElementById("activeCategoryTitle").textContent = "";
      document.getElementById("activeCategoryCount").textContent = "0 Featured Photos";
      document.getElementById("galleryGrid").replaceChildren();
      return;
    }

    // Gallery limits can be adjusted per category without changing the others.
    // The owner's three preferred images should be first in each photos array.
    const photoLimits = {
      "property-maintenance": 8,
      "flooring": 10,
      "tile": 10,
      "renovations": 7
    };
    const photoLimit = photoLimits[cat.slug] ?? 5;
    const featuredPhotos = (cat.photos || []).slice(0, photoLimit);
    document.getElementById("activeCategoryTitle").textContent = cat.name;
    document.getElementById("activeCategoryCount").textContent =
      `${featuredPhotos.length} Featured Photo${featuredPhotos.length === 1 ? "" : "s"}`;

    const grid = document.getElementById("galleryGrid");
    if (!featuredPhotos.length) {
      grid.innerHTML = `<p class="section-intro">Project photographs for ${esc(cat.name)} are being updated.</p>`;
      return;
    }

    // Show both stages together when every featured photo has a matching before image.
    if (cat.slug === "before-after" && featuredPhotos.every(photo => photo.before_url)) {
      grid.classList.add("ba-gallery");
      grid.innerHTML = featuredPhotos.map((photo, idx) => `
        <figure tabindex="0" role="button" class="photo-card ba-pair-card" data-photo-idx="${idx}" style="margin:0;">
          <div class="ba-pair-images">
            <div><span>Before</span><img src="${resolveMediaUrl(photo.before_url)}" alt="Before: ${esc(photo.caption || cat.name)}" loading="lazy" /></div>
            <div><span>${idx === 3 ? "Progress" : "After"}</span><img src="${resolveMediaUrl(photo.url)}" alt="${idx === 3 ? "Progress" : "After"}: ${esc(photo.caption || cat.name)}" loading="lazy" /></div>
          </div>
        </figure>
      `).join("");
      grid.querySelectorAll(".photo-card").forEach(card => {
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); } });
        card.addEventListener("click", () => openLightbox(featuredPhotos[Number(card.dataset.photoIdx)], cat.name));
      });
      return;
    }
    grid.classList.remove("ba-gallery");
    grid.innerHTML = featuredPhotos.map((photo, idx) => `
      <figure tabindex="0" role="button" class="photo-card" data-photo-idx="${idx}" style="margin:0;">
        <div class="photo-card-img-wrap">
          <img src="${resolveMediaUrl(photo.url)}" alt="${esc(photo.caption || cat.name)}" loading="lazy" />
          ${photo.before_url ? `<span class="ba-badge">Before &amp; After</span>` : ""}
        </div>
      </figure>
    `).join("");

    grid.querySelectorAll(".photo-card").forEach(card => {
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); } });
      card.addEventListener("click", () => {
        const photo = featuredPhotos[Number(card.dataset.photoIdx)];
        openLightbox(photo, cat.name);
      });
    });
  }

  function openLightbox(photo, categoryName) {
    const lb = document.getElementById("lightbox");
    const media = document.getElementById("lightboxMedia");
    const cap = document.getElementById("lightboxCaption");

    if (photo.before_url) {
      media.innerHTML = `
        <div class="ba-compare-grid">
          <div class="ba-pane">
            <span>Before</span>
            <img src="${resolveMediaUrl(photo.before_url)}" alt="Before: ${esc(photo.caption || categoryName)}" />
          </div>
          <div class="ba-pane">
            <span>${photo.caption?.includes("in Progress") ? "Progress" : "After"}</span>
            <img src="${resolveMediaUrl(photo.url)}" alt="${photo.caption?.includes("in Progress") ? "Progress" : "After"}: ${esc(photo.caption || categoryName)}" />
          </div>
        </div>
      `;
    } else {
      media.innerHTML = `<img src="${resolveMediaUrl(photo.url)}" alt="${esc(photo.caption || categoryName)}" />`;
    }

    cap.textContent = categoryName;
    lb.hidden = false;
    lastFocus = document.activeElement;
    document.getElementById("lightboxClose").focus();
  }

  function setupNavigationAndPresets() {
    const menuBtn = document.getElementById("mobileMenuBtn");
    const nav = document.getElementById("primaryNav");
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      const preset = e.target.closest("[data-preset-service]");
      if (preset) {
        const select = document.getElementById("serviceType");
        const val = preset.dataset.presetService;
        if ([...select.options].some(o => o.value === val)) {
          select.value = val;
        }
      }
    });

    document.getElementById("lightboxClose").onclick = closeLightbox;
    document.getElementById("lightboxCloseBg").onclick = closeLightbox;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "Tab" && !document.getElementById("lightbox").hidden) { e.preventDefault(); document.getElementById("lightboxClose").focus(); }
    });
  }

  function setupServiceForm() {
    const form = document.getElementById("serviceRequestForm");
    const fileInput = document.getElementById("projectFiles");
    const previewList = document.getElementById("filePreviewList");
    const feedback = document.getElementById("formFeedback");
    const submitBtn = document.getElementById("submitBtn");

    function renderFileList() {
      previewList.innerHTML = selectedFiles.map((f, i) => `
        <li>
          <span>${esc(f.name)} (${(f.size / (1024 * 1024)).toFixed(1)} MB)</span>
          <button type="button" data-rm="${i}" style="background:none;border:none;color:#B42318;cursor:pointer;font-weight:700;">✕</button>
        </li>
      `).join("");
      previewList.querySelectorAll("[data-rm]").forEach(btn => {
        btn.onclick = () => {
          selectedFiles.splice(Number(btn.dataset.rm), 1);
          renderFileList();
        };
      });
    }

    fileInput.addEventListener("change", () => {
      const incoming = Array.from(fileInput.files || []);
      for (const f of incoming) {
        if (selectedFiles.length >= 5) { showFeedback("Maximum 5 attachments allowed.", "error"); break; }
        if (!/^(image\/(jpeg|jpg|png|webp|heic|heif)|video\/(mp4|quicktime))$/i.test(f.type)) { showFeedback("Please select JPEG, PNG, WebP, HEIC/HEIF, MP4 or MOV files.", "error"); continue; }
        if (f.size > 25 * 1024 * 1024) {
          showFeedback(`"${esc(f.name)}" exceeds the 25MB per-file limit.`, "error");
          continue;
        }
        selectedFiles.push(f);
      }
      fileInput.value = "";
      renderFileList();
    });

    function showFeedback(msg, type) {
      feedback.textContent = msg;
      feedback.className = `form-feedback ${type}`;
      feedback.hidden = false;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      feedback.hidden = true;

      const name = document.getElementById("custName").value.trim();
      const phone = document.getElementById("custPhone").value.trim();
      const email = document.getElementById("custEmail").value.trim();
      const location = document.getElementById("custLocation").value.trim();
      const service = document.getElementById("serviceType").value;
      const propertyType = document.getElementById("propertyType").value;
      const description = document.getElementById("projectDesc").value.trim();
      const honeypot = document.getElementById("website_url").value;

      if (!form.reportValidity()) return;
      if (selectedFiles.reduce((n, f) => n + f.size, 0) > 30 * 1024 * 1024) {
        showFeedback("Please keep all attachments together below 30MB.", "error"); return;
      }
      if (!name || !phone || !email || !location || !description) {
        showFeedback("Please complete all required fields marked with *.", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "SENDING REQUEST...";

      try {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("phone", phone);
        fd.append("email", email);
        fd.append("location", location);
        fd.append("service", service);
        fd.append("propertyType", propertyType);
        fd.append("description", description);
        fd.append("website_url", honeypot);
        selectedFiles.forEach(file => fd.append("files", file));

        const res = await fetch("/api/submit-inquiry", { method: "POST", body: fd });
        const result = await res.json();

        if (!res.ok || !result.saved) {
          throw new Error(result.error || "Unable to submit request. Please call 409-919-0038.");
        }

        form.reset();
        selectedFiles = [];
        renderFileList();
        if (result.notification === "accepted") {
          showFeedback("Email sent.", "success");
        } else {
          showFeedback(`Your service request and files have been saved, but the email notification failed or could not be confirmed. Please call 409-919-0038 and quote your reference. Reference: ${result.inquiryId}`, "error");
        }
      } catch (err) {
        showFeedback(err.message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "SUBMIT SERVICE REQUEST";
      }
    });
  }

  renderStaticSections();
  setupNavigationAndPresets();
  setupServiceForm();
  loadGalleryData();
})();
