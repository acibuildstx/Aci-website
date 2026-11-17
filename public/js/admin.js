(function () {
  const esc = window.ACI_UI.escape;
  let ready = false;
  let state = JSON.parse(JSON.stringify(window.ACI_CONFIG.starterCategories));
  let heroImage = window.ACI_CONFIG.hero.heroImage;
  let selectedSlug = state[0].slug;
  const statusEl = document.getElementById("adminStatus");

  function setStatus(text) {
    statusEl.textContent = text;
  }

  async function compressToWebP(file, maxWidth = 1600, quality = 0.84) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width * img.height > 60000000) { reject(new Error("Image is too large to process. Resize it first.")); return; }
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob?.type === "image/webp" ? resolve(blob) : reject(new Error("WebP conversion failed.")), "image/webp", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This browser cannot decode this image. Use JPEG, PNG or WebP.")); };
      img.src = url;
    });
  }

  async function init() {
    try {
      const res = await fetch("/api/admin/state");
      if (!res.ok) throw new Error("Owner sign-in or database configuration is required.");
      const data = await res.json();
      if (data.initialized) state = data.categories;
      if (data.heroImage) heroImage = data.heroImage;
      selectedSlug = state[0]?.slug;
      ready = true;
      setStatus("Gallery database connected; uploads require R2");
    } catch (error) {
      setStatus(error.message || "Unable to load gallery. Reload after signing in.");
      document.querySelectorAll("button, input, select").forEach(el => el.disabled = true);
      return;
    }
    renderCategories();
    renderEditor();
  }

  function renderCategories() {
    const list = document.getElementById("adminCategoryList");
    list.innerHTML = state.map((cat, idx) => `
      <div class="cat-row ${cat.slug === selectedSlug ? "active" : ""}" data-slug="${esc(cat.slug)}">
        <div>
          <span>${esc(cat.name)}</span>
          <small style="display:block;color:var(--text-muted);">${cat.visible ? "Visible" : "Hidden"} • ${(cat.photos || []).length} photos</small>
        </div>
        <div style="display:flex;gap:0.25rem;">
          <button type="button" class="mini-btn" data-move-cat="-1" data-idx="${idx}" ${idx === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="mini-btn" data-move-cat="1" data-idx="${idx}" ${idx === state.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".cat-row").forEach(row => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("[data-move-cat]")) return;
        selectedSlug = row.dataset.slug;
        renderCategories();
        renderEditor();
      });
    });

    list.querySelectorAll("[data-move-cat]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.idx);
        const dir = Number(btn.dataset.moveCat);
        const target = idx + dir;
        if (target < 0 || target >= state.length) return;
        [state[idx], state[target]] = [state[target], state[idx]];
        state.forEach((c, i) => (c.sort_order = i + 1));
        renderCategories();
      });
    });
  }

  function renderEditor() {
    const cat = state.find(c => c.slug === selectedSlug);
    if (!cat) return;

    const nameInput = document.getElementById("editCatName");
    const visSelect = document.getElementById("editCatVisible");
    nameInput.value = cat.name;
    visSelect.value = String(Boolean(cat.visible));

    nameInput.oninput = () => {
      cat.name = nameInput.value;
      renderCategories();
    };

    visSelect.onchange = () => {
      cat.visible = visSelect.value === "true";
      renderCategories();
    };

    const grid = document.getElementById("adminPhotoGrid");
    grid.innerHTML = (cat.photos || []).map((p, idx) => `
      <div class="photo-admin-card">
        <img src="${window.ACI_UI.media(p.url)}" alt="${esc(p.caption || "")}" />
        <input type="text" class="form-control" style="padding:0.4rem;font-size:0.82rem;" value="${esc(p.caption || "")}" placeholder="Photo caption..." data-cap-idx="${idx}" />
        <div style="font-size:0.75rem;color:var(--text-muted);">
          ${idx < 3 ? "★ Featured in top 3" : "Portfolio archive"} ${p.is_cover ? "• Category Cover" : ""} ${p.url === heroImage ? "• Homepage Hero" : ""} ${p.before_url ? "• Has Before Pair" : ""}
        </div>
        <div class="admin-btn-row">
          <button type="button" class="mini-btn" data-move-p="-1" data-pidx="${idx}" ${idx === 0 ? "disabled" : ""}>←</button>
          <button type="button" class="mini-btn" data-move-p="1" data-pidx="${idx}" ${idx === cat.photos.length - 1 ? "disabled" : ""}>→</button>
          <button type="button" class="mini-btn gold" data-cover="${idx}">Set Cover</button>
          <button type="button" class="mini-btn gold" data-hero="${idx}">Set Hero</button>
          <button type="button" class="mini-btn" data-ba="${idx}">+ Before Pair</button>
          <button type="button" class="mini-btn danger" data-del="${idx}">Delete</button>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll("[data-cap-idx]").forEach(inp => {
      inp.oninput = () => (cat.photos[Number(inp.dataset.capIdx)].caption = inp.value);
    });

    grid.querySelectorAll("[data-move-p]").forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.dataset.pidx);
        const t = i + Number(btn.dataset.moveP);
        if (t < 0 || t >= cat.photos.length) return;
        [cat.photos[i], cat.photos[t]] = [cat.photos[t], cat.photos[i]];
        renderEditor();
      };
    });

    grid.querySelectorAll("[data-cover]").forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.dataset.cover);
        cat.photos.forEach((p, idx) => (p.is_cover = idx === i));
        const [chosen] = cat.photos.splice(i, 1);
        cat.photos.unshift(chosen);
        renderEditor();
        setStatus("Cover updated (Click Publish Live to apply)");
      };
    });

    grid.querySelectorAll("[data-hero]").forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.dataset.hero);
        heroImage = cat.photos[i].url;
        renderEditor();
        setStatus("Homepage Hero photo updated (Click Publish Live to apply)");
      };
    });

    grid.querySelectorAll("[data-ba]").forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.dataset.ba);
        const picker = document.createElement("input");
        picker.type = "file";
        picker.accept = "image/*";
        picker.onchange = async () => {
          const file = picker.files[0];
          if (!file) return;
          try {
          const webpBlob = await compressToWebP(file);
          const uploadedUrl = await uploadAdminImage(webpBlob, file, `${cat.slug}-before-${Date.now()}.webp`, cat.slug);
          cat.photos[i].before_url = uploadedUrl;
          renderEditor();
          setStatus("Before & After pair linked; save draft or publish to persist");
          } catch (error) { setStatus(error.message); }
        };
        picker.click();
      };
    });

    grid.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = () => {
        if (!confirm("Remove this photograph from the gallery?")) return;
        cat.photos.splice(Number(btn.dataset.del), 1);
        renderEditor();
        renderCategories();
      };
    });
  }

  async function uploadAdminImage(webpBlob, originalFile, filename, uploadCategory = selectedSlug) {
    if (webpBlob.size + originalFile.size > 30 * 1024 * 1024) throw new Error("Image and optimized copy must total no more than 30MB.");
    const fd = new FormData();
    fd.append("webp", webpBlob, filename);
    fd.append("original", originalFile, originalFile.name);
    fd.append("category", uploadCategory);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || !data.ok || !window.ACI_UI.media(data.publicUrl)) throw new Error(data.error || "Upload failed. Nothing was added to the gallery.");
    return data.publicUrl;
  }

  document.getElementById("adminUploadInput").addEventListener("change", async (e) => {
    const cat = state.find(c => c.slug === selectedSlug);
    const files = Array.from(e.target.files || []);
    if (!cat || !files.length) return;

    setStatus(`Optimizing & uploading ${files.length} photo(s)...`);
    try {
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) throw new Error("Maximum image size is 25MB.");
      const webpBlob = await compressToWebP(file);
      const url = await uploadAdminImage(webpBlob, file, `${cat.slug}-${Date.now()}.webp`, cat.slug);
      cat.photos.push({
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url,
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        is_cover: cat.photos.length === 0
      });
    }
    e.target.value = "";
    renderCategories();
    renderEditor();
    setStatus("Photos uploaded; save draft or publish to persist gallery changes");
    } catch (error) { setStatus(error.message); renderCategories(); renderEditor(); }
    finally { e.target.value = ""; }
  });

  document.getElementById("addCategoryBtn").onclick = () => {
    const name = prompt("Enter new category name:");
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug || slug.length > 80 || name.length > 100 || state.some(c => c.slug === slug)) { setStatus("Choose a unique category name (maximum 100 characters)."); return; }
    state.push({ slug, name, visible: true, sort_order: state.length + 1, photos: [] });
    selectedSlug = slug;
    renderCategories();
    renderEditor();
  };

  async function persistState(mode) {
    if (!ready) { setStatus("Load the gallery before saving."); return; }
    setStatus(mode === "publish" ? "Publishing live..." : "Saving draft...");
    document.getElementById("saveDraftBtn").disabled = true;
    document.getElementById("publishLiveBtn").disabled = true;
    try {
      const res = await fetch("/api/admin/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, categories: state, heroImage, revision: window.ACI_CONFIG.galleryRevision })
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error || "Server save failed");
      setStatus(mode === "publish" ? "Published Live ✓" : "Draft Saved ✓");
    } catch (err) {
      setStatus(err.message || "Save failed; changes remain unsaved.");
    } finally {
      document.getElementById("saveDraftBtn").disabled = false;
      document.getElementById("publishLiveBtn").disabled = false;
    }
  }

  document.getElementById("saveDraftBtn").onclick = () => persistState("draft");
  document.getElementById("publishLiveBtn").onclick = () => persistState("publish");

  init();
})();
