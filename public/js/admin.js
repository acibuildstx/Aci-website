(function () {
  const esc = window.ACI_UI.escape;
  let ready = false;
  let state = JSON.parse(JSON.stringify(window.ACI_CONFIG.starterCategories));
  let heroImage = null;
  let version = null;
  let pendingPhotoEdits = 0;
  let needsDraft = false;
  let saving = false;
  let editingPhoto = false;
  let selectedSlug = state[0].slug;
  const statusEl = document.getElementById("adminStatus");

  const dialog = document.getElementById("photoChangeDialog");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const publishLiveBtn = document.getElementById("publishLiveBtn");

  function updateSaveControls() {
    saveDraftBtn.disabled = !ready || saving || pendingPhotoEdits > 0;
    publishLiveBtn.disabled = saveDraftBtn.disabled || needsDraft;
  }

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
      heroImage = data.heroImage ?? null;
      version = data.version;
      if (version !== null && typeof version !== "string") throw new Error("Reload the Owner Portal to use the current gallery editor.");
      selectedSlug = state[0]?.slug;
      ready = true;
      updateSaveControls();
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
          <button type="button" class="mini-btn" data-replace="${esc(p.id)}">Replace Photo</button>
          <button type="button" class="mini-btn" data-ba="${esc(p.id)}">+ Before Pair</button>
          <button type="button" class="mini-btn" data-move-photo="${esc(p.id)}" ${state.length < 2 ? "disabled" : ""}>Move to Category</button>
          ${p.previous_url ? `<button type="button" class="mini-btn" data-restore-photo="${esc(p.id)}">Restore Previous</button>` : ""}
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

    grid.querySelectorAll("[data-replace], [data-ba]").forEach(button => {
      button.onclick = () => choosePhoto(cat, button.dataset.replace || button.dataset.ba,
        button.hasAttribute("data-replace") ? "url" : "before_url");
    });
    grid.querySelectorAll("[data-restore-photo]").forEach(button => {
      button.onclick = () => restorePhoto(cat, button.dataset.restorePhoto);
    });
    grid.querySelectorAll("[data-move-photo]").forEach(button => {
      button.onclick = () => movePhoto(cat, button.dataset.movePhoto);
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

  function resolvePhoto(cat, original, field) {
    const current = cat.photos.find(photo => photo.id === original.id);
    if (!current || current.url !== original.url || current[field] !== original[field]) {
      throw new Error("This photo was removed, moved, or changed. No photo was updated.");
    }
    return current;
  }

  function previewChange({ title, description, current, next, label = "Current", destinations = [] }) {
    const destination = document.getElementById("photoDestination");
    document.getElementById("photoChangeTitle").textContent = title;
    document.getElementById("photoChangeDescription").textContent = description;
    document.getElementById("currentPhotoLabel").textContent = label;
    for (const [id, url] of [["currentPhotoPreview", current], ["replacementPhotoPreview", next]]) {
      const figure = document.getElementById(id);
      figure.hidden = !url;
      if (url) figure.querySelector("img").src = url;
    }
    document.getElementById("photoDestinationField").hidden = !destinations.length;
    destination.replaceChildren(...destinations.map(cat => new Option(cat.name, cat.slug)));
    dialog.returnValue = "";
    return new Promise(resolve => {
      dialog.addEventListener("close", () => {
        dialog.querySelectorAll("img").forEach(img => img.removeAttribute("src"));
        resolve(dialog.returnValue === "confirm" ? destination.value || true : false);
      }, { once: true });
      dialog.showModal();
    });
  }

  function photoChanged(message) {
    needsDraft = true;
    renderCategories();
    renderEditor();
    setStatus(`${message} Save Draft, then Publish Live to apply.`);
  }

  async function editPhoto(action) {
    if (editingPhoto || saving) { setStatus("Finish the current photo change first."); return; }
    editingPhoto = true;
    pendingPhotoEdits++;
    updateSaveControls();
    try { await action(); }
    catch (error) { setStatus(error.message); }
    finally {
      editingPhoto = false;
      pendingPhotoEdits--;
      updateSaveControls();
    }
  }

  function choosePhoto(cat, id, field) {
    const original = { ...cat.photos.find(photo => photo.id === id) };
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.onchange = () => {
      const file = picker.files[0];
      if (!file) return;
      editPhoto(async () => {
        resolvePhoto(cat, original, field);
        const replacing = field === "url";
        const webp = await compressToWebP(file);
        const preview = URL.createObjectURL(webp);
        let confirmed;
        try {
          confirmed = await previewChange({
            title: replacing ? "Replace Photo" : "Link Before Photo",
            description: `${cat.name} — ${original.caption || original.id}`,
            current: window.ACI_UI.media(original[field] || original.url),
            next: preview,
            label: !replacing && !original.before_url ? "Gallery photo" : "Current"
          });
        } finally { URL.revokeObjectURL(preview); }
        if (!confirmed) return;
        resolvePhoto(cat, original, field);
        setStatus("Uploading photo…");
        const url = await uploadAdminImage(webp, file, `${id}.webp`, cat.slug);
        const current = resolvePhoto(cat, original, field);
        if (url === current[field]) throw new Error("The upload did not return a new photo URL.");
        if (replacing) current.previous_url = current.url;
        current[field] = url;
        photoChanged(replacing ? "Photo replaced in the editor." : "Before photo linked in the editor.");
      });
    };
    picker.click();
  }

  function restorePhoto(cat, id) {
    const original = { ...cat.photos.find(photo => photo.id === id) };
    editPhoto(async () => {
      const confirmed = await previewChange({
        title: "Restore Previous Photo",
        description: `${cat.name} — ${original.caption || id}`,
        current: window.ACI_UI.media(original.url),
        next: window.ACI_UI.media(original.previous_url)
      });
      if (!confirmed) return;
      const current = resolvePhoto(cat, original, "previous_url");
      [current.url, current.previous_url] = [current.previous_url, current.url];
      photoChanged("Previous photo restored in the editor.");
    });
  }

  function movePhoto(cat, id) {
    const original = { ...cat.photos.find(photo => photo.id === id) };
    editPhoto(async () => {
      const eligible = destination => destination !== cat && !destination.photos.some(photo =>
        photo.id === id || (original.is_cover && photo.is_cover));
      const destinations = state.filter(eligible);
      if (!destinations.length) throw new Error("No destination can keep this photo’s ID and cover status. Choose a different source cover first if needed.");
      const slug = await previewChange({
        title: "Move Photo to Another Category",
        description: `From ${cat.name}. The photo will be added at the end of the destination’s list.`,
        current: window.ACI_UI.media(original.url),
        label: "Selected photo",
        destinations
      });
      if (!slug) return;
      const destination = state.find(category => category.slug === slug);
      const current = resolvePhoto(cat, original, "is_cover");
      if (!destination || !eligible(destination)) throw new Error("This destination changed. No photo was moved.");
      cat.photos.splice(cat.photos.indexOf(current), 1);
      destination.photos.push(current);
      photoChanged(`Photo moved to ${destination.name} in the editor.`);
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
    if (!res.ok || !data.ok || !data.publicUrl?.startsWith("/api/public-media/") || !window.ACI_UI.media(data.publicUrl)) throw new Error(data.error || "Upload failed. Nothing was added to the gallery.");
    return data.publicUrl;
  }

  document.getElementById("adminUploadInput").addEventListener("change", async (e) => {
    const cat = state.find(c => c.slug === selectedSlug);
    const files = Array.from(e.target.files || []);
    if (!cat || !files.length) return;

    pendingPhotoEdits++;
    updateSaveControls();
    setStatus(`Optimizing & uploading ${files.length} photo(s)...`);
    try {
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) throw new Error("Maximum image size is 25MB.");
      const webpBlob = await compressToWebP(file);
      const url = await uploadAdminImage(webpBlob, file, `${cat.slug}-${Date.now()}.webp`, cat.slug);
      cat.photos.push({
        id: crypto.randomUUID(),
        url,
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        is_cover: cat.photos.length === 0
      });
    }
    renderCategories();
    renderEditor();
    setStatus("Photos uploaded; save draft or publish to persist gallery changes");
    } catch (error) { setStatus(error.message); renderCategories(); renderEditor(); }
    finally {
      e.target.value = "";
      pendingPhotoEdits--;
      updateSaveControls();
    }
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
    if (saving || pendingPhotoEdits || (mode === "publish" && needsDraft)) return;
    setStatus(mode === "publish" ? "Publishing live..." : "Saving draft...");
    saving = true;
    updateSaveControls();
    document.querySelector("main").inert = true;
    try {
      const res = await fetch("/api/admin/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, categories: state, heroImage, version, revision: window.ACI_CONFIG.galleryRevision })
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error || "Server save failed");
      version = result.version;
      if (mode === "draft") needsDraft = false;
      setStatus(mode === "publish" ? "Published Live ✓" : "Draft Saved ✓");
    } catch (err) {
      setStatus(err.message || "Save failed; changes remain unsaved.");
    } finally {
      saving = false;
      document.querySelector("main").inert = false;
      updateSaveControls();
    }
  }

  saveDraftBtn.onclick = () => persistState("draft");
  publishLiveBtn.onclick = () => persistState("publish");

  updateSaveControls();
  init();
})();
