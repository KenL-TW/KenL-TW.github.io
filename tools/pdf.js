(() => {
  "use strict";

  // pdf.js is provided by CDN, exposed as window.pdfjsLib (see index.html)
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    alert("pdf.js 未載入成功。請確認網路可連線到 CDN，或改成本地 vendor 檔案。");
    return;
  }

  // =========================
  // State / DOM
  // =========================
  const state = {
    pdfDoc: null,
    pdfBytes: null,
    pageCount: 0,
    pageIndex: 0,
    zoom: 1.0,
    pagesMeta: [],
    annotations: [],
    selectedId: null,
    history: { undo: [], redo: [] },
  };

  const dom = {
    fileInput: document.getElementById("fileInput"),
    stampInput: document.getElementById("stampInput"),
    pdfCanvas: document.getElementById("pdfCanvas"),
    overlay: document.getElementById("overlay"),
    guides: document.getElementById("guides"),
    stage: document.getElementById("stage"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    btnZoomIn: document.getElementById("btnZoomIn"),
    btnZoomOut: document.getElementById("btnZoomOut"),
    btnAddBuiltinStamp: document.getElementById("btnAddBuiltinStamp"),
    btnAddSign: document.getElementById("btnAddSign"),
    btnAddText: document.getElementById("btnAddText"),
    btnAddRect: document.getElementById("btnAddRect"),
    btnUndo: document.getElementById("btnUndo"),
    btnRedo: document.getElementById("btnRedo"),
    btnExport: document.getElementById("btnExport"),
    pageLabel: document.getElementById("pageLabel"),
    zoomLabel: document.getElementById("zoomLabel"),
    opacityRange: document.getElementById("opacityRange"),
    opacityLabel: document.getElementById("opacityLabel"),
    rotateRange: document.getElementById("rotateRange"),
    rotateLabel: document.getElementById("rotateLabel"),
    colorInput: document.getElementById("colorInput"),
    colorLabel: document.getElementById("colorLabel"),
    thicknessRange: document.getElementById("thicknessRange"),
    thicknessLabel: document.getElementById("thicknessLabel"),
    btnBringFront: document.getElementById("btnBringFront"),
    btnSendBack: document.getElementById("btnSendBack"),
    btnLock: document.getElementById("btnLock"),
    btnDelete: document.getElementById("btnDelete"),
    signDialog: document.getElementById("signDialog"),
    signCanvas: document.getElementById("signCanvas"),
    btnSignClose: document.getElementById("btnSignClose"),
    btnSignClear: document.getElementById("btnSignClear"),
    btnSignUse: document.getElementById("btnSignUse"),
  };

  const uid = () => "a_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const normalizeHexColor = (c, fallback = "#111111") => {
    if (typeof c !== "string") return fallback;
    const m = c.trim().match(/^#([0-9a-fA-F]{6})$/);
    return m ? `#${m[1].toLowerCase()}` : fallback;
  };
  const hexToRgb01 = (hex) => {
    const c = normalizeHexColor(hex, "#111111");
    const r = parseInt(c.slice(1, 3), 16) / 255;
    const g = parseInt(c.slice(3, 5), 16) / 255;
    const b = parseInt(c.slice(5, 7), 16) / 255;
    return { r, g, b };
  };
  const normalizeDeg = (d) => {
    let x = d % 360;
    if (x > 180) x -= 360;
    if (x < -180) x += 360;
    return x;
  };

  function getAnno(id) { return state.annotations.find(a => a.id === id); }
  function getSelected() { return state.selectedId ? getAnno(state.selectedId) : null; }
  function pageMeta(i) { return state.pagesMeta[i]; }
  function snapshotAnno(a) { return JSON.parse(JSON.stringify(a)); }

  // =========================
  // History
  // =========================
  function pushCommand(cmd) {
    state.history.undo.push(cmd);
    state.history.redo.length = 0;
    UI.updateButtons();
  }
  function undo() {
    const cmd = state.history.undo.pop();
    if (!cmd) return;
    cmd.undo();
    state.history.redo.push(cmd);
    UI.updateButtons();
    OverlayEngine.render();
    UI.syncInspector();
  }
  function redo() {
    const cmd = state.history.redo.pop();
    if (!cmd) return;
    cmd.do();
    state.history.undo.push(cmd);
    UI.updateButtons();
    OverlayEngine.render();
    UI.syncInspector();
  }

  const cmdAddAnno = (a) => ({
    do() { state.annotations.push(a); state.selectedId = a.id; },
    undo() { state.annotations = state.annotations.filter(x => x.id !== a.id); if (state.selectedId === a.id) state.selectedId = null; }
  });
  const cmdRemoveAnno = (id, snap) => ({
    do() { state.annotations = state.annotations.filter(x => x.id !== id); if (state.selectedId === id) state.selectedId = null; },
    undo() { state.annotations.push(snap); }
  });
  const cmdUpdateAnno = (id, before, after) => ({
    do() { Object.assign(getAnno(id), after); },
    undo() { Object.assign(getAnno(id), before); }
  });

  // =========================
  // PDF Engine
  // =========================
  const PDFEngine = {
    async loadFromFile(file) {
      const rawBytes = new Uint8Array(await file.arrayBuffer());
      state.pdfBytes = rawBytes.slice();

      const bytesForViewer = rawBytes.slice();
      state.pdfDoc = await pdfjsLib.getDocument({ data: bytesForViewer }).promise;

      state.pageCount = state.pdfDoc.numPages;
      state.pageIndex = 0;
      state.zoom = 1.0;

      state.annotations = [];
      state.selectedId = null;
      state.history.undo.length = 0;
      state.history.redo.length = 0;

      state.pagesMeta = [];
      for (let i=1; i<=state.pageCount; i++) {
        const page = await state.pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        state.pagesMeta.push({ baseWidthPx: vp.width, baseHeightPx: vp.height, pdfWidthPt: null, pdfHeightPt: null });
      }

      await this.renderCurrentPage();
      UI.updateLabels();
      UI.updateButtons();
    },

    async renderCurrentPage() {
      if (!state.pdfDoc) return;
      const page = await state.pdfDoc.getPage(state.pageIndex + 1);
      const viewport = page.getViewport({ scale: state.zoom });

      const canvas = dom.pdfCanvas;
      const ctx = canvas.getContext("2d", { alpha: false });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      dom.stage.style.width = canvas.width + "px";
      dom.stage.style.height = canvas.height + "px";
      dom.overlay.style.width = canvas.width + "px";
      dom.overlay.style.height = canvas.height + "px";
      dom.guides.style.width = canvas.width + "px";
      dom.guides.style.height = canvas.height + "px";

      await page.render({ canvasContext: ctx, viewport }).promise;

      OverlayEngine.render();
      UI.updateLabels();
      UI.syncInspector();
    }
  };

  // =========================
  // Overlay
  // =========================
  const OverlayEngine = {
    render() {
      dom.overlay.innerHTML = "";
      dom.guides.innerHTML = "";
      if (!state.pdfDoc) return;

      const list = state.annotations
        .filter(a => a.pageIndex === state.pageIndex)
        .sort((a,b) => (a.zIndex||0) - (b.zIndex||0));

      for (const a of list) {
        const el = this.createElement(a);
        dom.overlay.appendChild(el);
        if (a.id === state.selectedId) {
          el.classList.add("selected");
          this.addHandles(el, a);
        }
      }
    },

    createElement(a) {
      const el = document.createElement("div");
      el.className = "anno";
      el.dataset.id = a.id;

      let content;
      if (a.type === "text") {
        content = document.createElement("div");
        content.textContent = a.text || "";
        content.style.whiteSpace = "pre";
        content.style.color = normalizeHexColor(a.color, "#111111");
        content.style.fontSize = `${(a.fontSize || 18) * state.zoom}px`;
        content.style.padding = "2px 4px";
        content.style.borderRadius = "6px";
        content.style.background = "rgba(255,255,255,0)";
        content.style.width = "100%";
        content.style.height = "100%";
      } else if (a.type === "rect") {
        content = document.createElement("div");
        content.style.width = "100%";
        content.style.height = "100%";
        content.style.display = "block";
        content.style.pointerEvents = "none";
        content.style.background = "transparent";
        content.style.borderStyle = "solid";
        content.style.boxSizing = "border-box";
        content.style.borderColor = normalizeHexColor(a.color, "#d10000");
        content.style.borderWidth = `${Math.max(1, a.strokeWidth || 4) * state.zoom}px`;
      } else {
        content = document.createElement("img");
        content.src = a.dataUrl;
        content.draggable = false;
        content.style.width = "100%";
        content.style.height = "100%";
        content.style.display = "block";
        content.style.pointerEvents = "none";
      }
      el.appendChild(content);
      el.style.left = (a.x * state.zoom) + "px";
      el.style.top  = (a.y * state.zoom) + "px";
      el.style.width = (a.w * state.zoom) + "px";
      el.style.height = (a.h * state.zoom) + "px";
      el.style.opacity = (a.opacity ?? 1);
      el.style.transform = `rotate(${a.rotation||0}deg)`;

      el.addEventListener("pointerdown", (ev) => Interaction.onAnnoDown(ev, a.id));
      el.addEventListener("dblclick", () => { if (a.type === "text") Interaction.editText(a.id); });
      return el;
    },

    addHandles(el, a) {
      const handles = [
        ["nw", 0, 0], ["n", 50, 0], ["ne", 100, 0],
        ["e", 100, 50], ["se", 100, 100], ["s", 50, 100],
        ["sw", 0, 100], ["w", 0, 50],
      ];
      for (const [name, px, py] of handles) {
        const h = document.createElement("div");
        h.className = "handle";
        h.dataset.handle = name;
        h.style.left = `calc(${px}% - 6px)`;
        h.style.top  = `calc(${py}% - 6px)`;
        h.addEventListener("pointerdown", (ev) => Interaction.onHandleDown(ev, a.id, name));
        el.appendChild(h);
      }
      const r = document.createElement("div");
      r.className = "handle rotate";
      r.dataset.handle = "rotate";
      r.style.left = `calc(50% - 7px)`;
      r.style.top  = `-22px`;
      r.addEventListener("pointerdown", (ev) => Interaction.onRotateDown(ev, a.id));
      el.appendChild(r);
    }
  };

  // =========================
  // Guides / Snap
  // =========================
  const Snap = {
    threshold: 8,
    clear() { dom.guides.innerHTML = ""; },
    v(x) {
      const g = document.createElement("div");
      g.className = "guide v";
      g.style.left = `${x}px`;
      g.style.top = "0px";
      g.style.height = "100%";
      dom.guides.appendChild(g);
    },
    h(y) {
      const g = document.createElement("div");
      g.className = "guide h";
      g.style.top = `${y}px`;
      g.style.left = "0px";
      g.style.width = "100%";
      dom.guides.appendChild(g);
    },
    apply(rect, stageW, stageH) {
      this.clear();
      let { x, y, w, h } = rect;
      const cx = x + w/2;
      const cy = y + h/2;

      const candidatesV = [0, stageW/2, stageW];
      const candidatesH = [0, stageH/2, stageH];

      const xs = [x, x+w, cx];
      const ys = [y, y+h, cy];

      let snapDx = 0, snapDy = 0;
      let bestDx = this.threshold + 1, bestDy = this.threshold + 1;
      let guideX = null, guideY = null;

      for (const xv of xs) for (const c of candidatesV) {
        const d = c - xv; const ad = Math.abs(d);
        if (ad <= this.threshold && ad < bestDx) { bestDx = ad; snapDx = d; guideX = c; }
      }
      for (const yv of ys) for (const c of candidatesH) {
        const d = c - yv; const ad = Math.abs(d);
        if (ad <= this.threshold && ad < bestDy) { bestDy = ad; snapDy = d; guideY = c; }
      }
      if (guideX !== null) this.v(guideX);
      if (guideY !== null) this.h(guideY);

      x += snapDx; y += snapDy;
      return { x, y, w, h };
    }
  };

  // =========================
  // Interaction
  // =========================
  const Interaction = {
    mode: null,
    activeId: null,
    handle: null,
    start: null,

    startPlace(id) {
      const a = getAnno(id);
      if (!a) return;
      this.mode = "place";
      this.activeId = id;
      this.handle = null;
      this.start = {
        before: snapshotAnno(a),
      };
      dom.stage.classList.add("placing");
      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();
    },

    stopPlace() {
      dom.stage.classList.remove("placing");
    },

    onAnnoDown(ev, id) {
      ev.preventDefault(); ev.stopPropagation();
      if (this.mode === "place") return;
      const a = getAnno(id);
      if (!a) return;

      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();

      if (a.locked) return;

      this.mode = "drag";
      this.activeId = id;
      this.handle = null;
      this.start = {
        startX: ev.clientX, startY: ev.clientY,
        origX: a.x, origY: a.y,
        before: snapshotAnno(a),
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },

    onHandleDown(ev, id, handle) {
      ev.preventDefault(); ev.stopPropagation();
      const a = getAnno(id);
      if (!a || a.locked) return;

      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();

      this.mode = "resize";
      this.activeId = id;
      this.handle = handle;
      this.start = {
        startX: ev.clientX, startY: ev.clientY,
        origX: a.x, origY: a.y, origW: a.w, origH: a.h,
        before: snapshotAnno(a),
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },

    onRotateDown(ev, id) {
      ev.preventDefault(); ev.stopPropagation();
      const a = getAnno(id);
      if (!a || a.locked) return;

      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();

      this.mode = "rotate";
      this.activeId = id;
      this.handle = "rotate";

      const el = dom.overlay.querySelector(`.anno[data-id="${id}"]`);
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;

      this.start = {
        centerX: cx, centerY: cy,
        startAngle: Math.atan2(ev.clientY - cy, ev.clientX - cx),
        origRotation: a.rotation || 0,
        before: snapshotAnno(a),
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },

    onMove(ev) {
      if (!this.mode || !this.start) return;
      const a = getAnno(this.activeId);
      if (!a) return;

      const stageW = dom.pdfCanvas.width;
      const stageH = dom.pdfCanvas.height;

      if (this.mode === "place") {
        const rect = dom.stage.getBoundingClientRect();
        const inside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        if (!inside) return;

        const xV = ev.clientX - rect.left - (a.w * state.zoom) / 2;
        const yV = ev.clientY - rect.top - (a.h * state.zoom) / 2;

        const clampedX = clamp(xV, 0, Math.max(0, stageW - a.w * state.zoom));
        const clampedY = clamp(yV, 0, Math.max(0, stageH - a.h * state.zoom));

        a.x = clampedX / state.zoom;
        a.y = clampedY / state.zoom;
        OverlayEngine.render();
        UI.syncInspector();
        return;
      }

      if (this.mode === "drag") {
        const dxV = ev.clientX - this.start.startX;
        const dyV = ev.clientY - this.start.startY;
        let xV = this.start.origX * state.zoom + dxV;
        let yV = this.start.origY * state.zoom + dyV;

        const snapped = Snap.apply({ x: xV, y: yV, w: a.w*state.zoom, h: a.h*state.zoom }, stageW, stageH);
        xV = snapped.x; yV = snapped.y;

        a.x = xV / state.zoom;
        a.y = yV / state.zoom;

        OverlayEngine.render();
        UI.syncInspector();
        return;
      }

      Snap.clear();

      if (this.mode === "resize") {
        const dx = (ev.clientX - this.start.startX) / state.zoom;
        const dy = (ev.clientY - this.start.startY) / state.zoom;
        let x = this.start.origX, y = this.start.origY;
        let w = this.start.origW, h = this.start.origH;
        const minSize = 12;
        const hnd = this.handle;

        const left = (hnd==="nw"||hnd==="w"||hnd==="sw");
        const right = (hnd==="ne"||hnd==="e"||hnd==="se");
        const top = (hnd==="nw"||hnd==="n"||hnd==="ne");
        const bottom = (hnd==="sw"||hnd==="s"||hnd==="se");

        if (right) w = clamp(this.start.origW + dx, minSize, 99999);
        if (bottom) h = clamp(this.start.origH + dy, minSize, 99999);

        if (left) {
          const newW = clamp(this.start.origW - dx, minSize, 99999);
          x = this.start.origX + (this.start.origW - newW);
          w = newW;
        }
        if (top) {
          const newH = clamp(this.start.origH - dy, minSize, 99999);
          y = this.start.origY + (this.start.origH - newH);
          h = newH;
        }

        a.x = x; a.y = y; a.w = w; a.h = h;
        OverlayEngine.render();
        UI.syncInspector();
        return;
      }

      if (this.mode === "rotate") {
        const ang = Math.atan2(ev.clientY - this.start.centerY, ev.clientX - this.start.centerX);
        const delta = ang - this.start.startAngle;
        const deg = delta * 180 / Math.PI;
        a.rotation = normalizeDeg(this.start.origRotation + deg);
        OverlayEngine.render();
        UI.syncInspector();
        return;
      }
    },

    onUp(ev) {
      if (!this.mode || !this.start) return;
      const a = getAnno(this.activeId);

      if (this.mode === "place") {
        if (ev && typeof ev.clientX === "number" && typeof ev.clientY === "number") {
          const rect = dom.stage.getBoundingClientRect();
          const inside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
          if (!inside) return;
        }
      }

      if (a) {
        const after = snapshotAnno(a);
        if (JSON.stringify(this.start.before) !== JSON.stringify(after)) {
          pushCommand(cmdUpdateAnno(a.id, this.start.before, after));
        }
      }
      if (this.mode === "place") this.stopPlace();
      this.mode = null;
      this.activeId = null;
      this.handle = null;
      this.start = null;
      Snap.clear();
    },

    editText(id) {
      const a = getAnno(id);
      if (!a || a.type !== "text" || a.locked) return;
      const before = snapshotAnno(a);
      const t = prompt("編輯文字內容：", a.text || "");
      if (t === null) return;
      a.text = t;
      const after = snapshotAnno(a);
      pushCommand(cmdUpdateAnno(a.id, before, after));
      OverlayEngine.render();
      UI.syncInspector();
    }
  };

  window.addEventListener("pointermove", (ev) => Interaction.onMove(ev));
  window.addEventListener("pointerup", (ev) => Interaction.onUp(ev));

  dom.overlay.addEventListener("pointerdown", (ev) => {
    if (ev.target === dom.overlay) {
      state.selectedId = null;
      OverlayEngine.render();
      UI.syncInspector();
    }
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && Interaction.mode === "place") {
      Interaction.stopPlace();
      Interaction.mode = null;
      Interaction.activeId = null;
      Interaction.handle = null;
      Interaction.start = null;
      return;
    }
    if (ev.key === "Delete" || ev.key === "Backspace") {
      UI.deleteSelected();
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      undo();
    }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === "y" || (ev.shiftKey && ev.key.toLowerCase() === "z"))) {
      ev.preventDefault();
      redo();
    }
  });

  // =========================
  // Signature Pad
  // =========================
  const SignaturePad = {
    ctx: null,
    drawing: false,
    last: null,

    init() {
      const c = dom.signCanvas;
      this.ctx = c.getContext("2d");
      this.ctx.lineWidth = 6;
      this.ctx.lineCap = "round";
      this.ctx.strokeStyle = "#111";

      c.addEventListener("pointerdown", (ev) => {
        this.drawing = true;
        this.last = this.pos(ev);
        c.setPointerCapture(ev.pointerId);
      });
      c.addEventListener("pointermove", (ev) => {
        if (!this.drawing) return;
        const p = this.pos(ev);
        this.ctx.beginPath();
        this.ctx.moveTo(this.last.x, this.last.y);
        this.ctx.lineTo(p.x, p.y);
        this.ctx.stroke();
        this.last = p;
      });
      c.addEventListener("pointerup", () => { this.drawing = false; });
    },

    pos(ev) {
      const r = dom.signCanvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientX && (ev.clientY - r.top) };
    },

    clear() {
      const c = dom.signCanvas;
      this.ctx.clearRect(0, 0, c.width, c.height);
    },

    open() { dom.signDialog.showModal(); },
    close() { dom.signDialog.close(); },

    getPngDataUrl() { return dom.signCanvas.toDataURL("image/png"); }
  };

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async function svgDataUrlToPngDataUrl(svgDataUrl, size=768) {
    const img = new Image();
    img.src = svgDataUrl;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(img, 0, 0, size, size);
    return c.toDataURL("image/png");
  }

  async function builtinStampDataUrl() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <defs>
          <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.15"/>
          </filter>
        </defs>
        <g filter="url(#s)">
          <circle cx="256" cy="256" r="218" fill="none" stroke="#d10000" stroke-width="18"/>
          <circle cx="256" cy="256" r="190" fill="none" stroke="#d10000" stroke-width="6" opacity="0.8"/>
          <text x="256" y="235" text-anchor="middle" font-size="56" fill="#d10000" font-family="sans-serif" font-weight="700">APPROVED</text>
          <text x="256" y="305" text-anchor="middle" font-size="34" fill="#d10000" font-family="sans-serif">eSIGN</text>
          <text x="256" y="355" text-anchor="middle" font-size="20" fill="#d10000" font-family="sans-serif" opacity="0.9">Digitools Studio</text>
        </g>
      </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const ctx = c.getContext("2d");
    ctx.clearRect(0,0,512,512);
    ctx.drawImage(img, 0, 0, 512, 512);
    URL.revokeObjectURL(url);
    return c.toDataURL("image/png");
  }

  async function imageSizeFromDataUrl(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    return {
      width: Math.max(1, img.naturalWidth || img.width || 1),
      height: Math.max(1, img.naturalHeight || img.height || 1),
    };
  }

  function calcInitialRect(srcW, srcH) {
    const stageW = Math.max(1, dom.pdfCanvas.width || 1);
    const stageH = Math.max(1, dom.pdfCanvas.height || 1);

    const maxW = Math.max(80, stageW * 0.38);
    const maxH = Math.max(80, stageH * 0.38);

    const scale = Math.min(maxW / srcW, maxH / srcH, 1);
    const w = clamp(Math.round(srcW * scale / state.zoom), 24, 2000);
    const h = clamp(Math.round(srcH * scale / state.zoom), 24, 2000);

    const x = clamp(Math.round((stageW / state.zoom - w) / 2), 0, 99999);
    const y = clamp(Math.round((stageH / state.zoom - h) / 2), 0, 99999);
    return { x, y, w, h };
  }

  async function addImageAnno(type, dataUrl, fallbackW=240, fallbackH=240, autoPlace=true) {
    let rect = { x: 40, y: 40, w: fallbackW, h: fallbackH };
    try {
      const imgSize = await imageSizeFromDataUrl(dataUrl);
      rect = calcInitialRect(imgSize.width, imgSize.height);
    } catch {
      rect = calcInitialRect(fallbackW, fallbackH);
    }

    const a = {
      id: uid(),
      type,
      pageIndex: state.pageIndex,
      x: rect.x, y: rect.y,
      w: rect.w, h: rect.h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: Date.now(),
      dataUrl,
    };
    const cmd = cmdAddAnno(a);
    cmd.do(); pushCommand(cmd);
    OverlayEngine.render();
    UI.syncInspector();
    if (autoPlace) Interaction.startPlace(a.id);
  }

  function addTextAnno(text="簽名：", w=220, h=44) {
    const rect = calcInitialRect(w, h);
    const a = {
      id: uid(),
      type: "text",
      pageIndex: state.pageIndex,
      x: rect.x, y: rect.y,
      w: rect.w, h: rect.h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: Date.now(),
      text,
      fontSize: 18,
      color: "#111111",
    };
    const cmd = cmdAddAnno(a);
    cmd.do(); pushCommand(cmd);
    OverlayEngine.render();
    UI.syncInspector();
  }

  function addRectAnno(w=260, h=140) {
    const rect = calcInitialRect(w, h);
    const a = {
      id: uid(),
      type: "rect",
      pageIndex: state.pageIndex,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: Date.now(),
      color: "#d10000",
      strokeWidth: 4,
    };
    const cmd = cmdAddAnno(a);
    cmd.do();
    pushCommand(cmd);
    OverlayEngine.render();
    UI.syncInspector();
    Interaction.startPlace(a.id);
  }

  // =========================
  // Export (pdf-lib)
  // =========================
  const Exporter = {
    async exportPdf() {
      if (!state.pdfBytes) return;
      if (!window.PDFLib) throw new Error("pdf-lib 未載入，請確認網路可連線到 CDN。");
      const { PDFDocument, StandardFonts, rgb } = PDFLib;
      if (!hasPdfHeader(state.pdfBytes)) {
        throw new Error("上傳的 PDF 二進位資料無效，請重新上傳 PDF 後再匯出。");
      }
      const pdfDoc = await PDFDocument.load(state.pdfBytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (let i=0; i<state.pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const meta = pageMeta(i);
        meta.pdfWidthPt = page.getWidth();
        meta.pdfHeightPt = page.getHeight();
      }

      for (let i=0; i<state.pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const meta = pageMeta(i);
        const scaleX = meta.pdfWidthPt / meta.baseWidthPx;
        const scaleY = meta.pdfHeightPt / meta.baseHeightPx;

        const annos = state.annotations
          .filter(a => a.pageIndex === i)
          .sort((a,b) => (a.zIndex||0) - (b.zIndex||0));

        for (const a of annos) {
          const x = a.x * scaleX;
          const y = meta.pdfHeightPt - (a.y + a.h) * scaleY;
          const w = a.w * scaleX;
          const h = a.h * scaleY;

          if (a.type === "text") {
            if ((a.rotation||0) !== 0) {
              const png = await rasterizeToPng(a);
              const img = await pdfDoc.embedPng(dataUrlToBytes(png));
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            } else {
              const c = hexToRgb01(a.color || "#111111");
              try {
                page.drawText(a.text || "", {
                  x,
                  y: y + Math.max(0, h - (a.fontSize * scaleY)),
                  size: (a.fontSize || 18) * scaleY,
                  font,
                  color: rgb(c.r, c.g, c.b),
                  opacity: a.opacity ?? 1,
                });
              } catch (err) {
                const message = (err && err.message) ? err.message : String(err);
                if (/WinAnsi cannot encode/i.test(message)) {
                  const png = await rasterizeToPng(a);
                  const img = await pdfDoc.embedPng(dataUrlToBytes(png));
                  page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
                } else {
                  throw err;
                }
              }
            }
          } else if (a.type === "rect") {
            if ((a.rotation||0) !== 0) {
              const png = await rasterizeToPng(a);
              const img = await pdfDoc.embedPng(dataUrlToBytes(png));
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            } else {
              const c = hexToRgb01(a.color || "#d10000");
              const sw = Math.max(1, (a.strokeWidth || 4) * ((scaleX + scaleY) / 2));
              page.drawRectangle({
                x,
                y,
                width: w,
                height: h,
                borderColor: rgb(c.r, c.g, c.b),
                borderWidth: sw,
                opacity: a.opacity ?? 1,
              });
            }
          } else {
            if ((a.rotation||0) !== 0) {
              const png = await rasterizeToPng(a);
              const img = await pdfDoc.embedPng(dataUrlToBytes(png));
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            } else {
              const img = await embedImageForPdf(pdfDoc, a.dataUrl);
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            }
          }
        }
      }

      const out = await pdfDoc.save({ useObjectStreams: false });
      downloadBytes(out, suggestName());
    }
  };

  function suggestName() {
    const base = (dom.fileInput.files?.[0]?.name || "signed.pdf").replace(/\.pdf$/i, "");
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    return `${base}-signed-${ts}.pdf`;
  }

  async function rasterizeToPng(a) {
    const dpr = Math.max(2, Math.floor(window.devicePixelRatio || 1));
    const cw = Math.max(1, Math.round(a.w * dpr));
    const ch = Math.max(1, Math.round(a.h * dpr));
    const c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    const ctx = c.getContext("2d");
    ctx.clearRect(0,0,cw,ch);

    ctx.save();
    ctx.translate(cw/2, ch/2);
    ctx.rotate(((a.rotation||0) * Math.PI) / 180);
    ctx.globalAlpha = a.opacity ?? 1;

    if (a.type === "text") {
      const fs = (a.fontSize || 18) * dpr;
      ctx.font = `${fs}px sans-serif`;
      ctx.fillStyle = normalizeHexColor(a.color, "#111111");
      ctx.textBaseline = "top";
      ctx.fillText(a.text || "", -cw/2 + 4*dpr, -ch/2 + 4*dpr);
    } else if (a.type === "rect") {
      ctx.strokeStyle = normalizeHexColor(a.color, "#d10000");
      ctx.lineWidth = Math.max(1, a.strokeWidth || 4) * dpr;
      const half = ctx.lineWidth / 2;
      ctx.strokeRect(-cw/2 + half, -ch/2 + half, Math.max(1, cw - ctx.lineWidth), Math.max(1, ch - ctx.lineWidth));
    } else {
      const img = new Image();
      img.src = a.dataUrl;
      await img.decode();
      ctx.drawImage(img, -cw/2, -ch/2, cw, ch);
    }
    ctx.restore();
    return c.toDataURL("image/png");
  }

  function dataUrlToBytes(dataUrl) {
    const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!m) throw new Error("Invalid dataUrl");
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i=0; i<bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function hasPdfHeader(bytes) {
    if (!bytes || !bytes.length) return false;
    const limit = Math.min(bytes.length - 4, 2048);
    for (let i = 0; i <= limit; i++) {
      if (
        bytes[i] === 0x25 && // %
        bytes[i + 1] === 0x50 && // P
        bytes[i + 2] === 0x44 && // D
        bytes[i + 3] === 0x46 && // F
        bytes[i + 4] === 0x2d // -
      ) {
        return true;
      }
    }
    return false;
  }

  async function embedImageForPdf(pdfDoc, dataUrl) {
    const m = dataUrl.match(/^data:(.+);base64,/);
    if (!m) throw new Error("Invalid image dataUrl");
    const mime = (m[1] || "").toLowerCase();
    const bytes = dataUrlToBytes(dataUrl);

    if (mime === "image/png") return pdfDoc.embedPng(bytes);
    if (mime === "image/jpeg" || mime === "image/jpg") return pdfDoc.embedJpg(bytes);

    const png = await forceDataUrlToPng(dataUrl);
    return pdfDoc.embedPng(dataUrlToBytes(png));
  }

  async function forceDataUrlToPng(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = Math.max(1, img.naturalWidth || img.width || 1);
    c.height = Math.max(1, img.naturalHeight || img.height || 1);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  }

  function downloadBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
  }

  // =========================
  // UI
  // =========================
  const UI = {
    bind() {
      dom.fileInput.addEventListener("change", async () => {
        const f = dom.fileInput.files?.[0];
        if (!f) return;
        await PDFEngine.loadFromFile(f);
      });

      dom.btnPrev.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        state.pageIndex = Math.max(0, state.pageIndex - 1);
        state.selectedId = null;
        await PDFEngine.renderCurrentPage();
      });

      dom.btnNext.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        state.pageIndex = Math.min(state.pageCount - 1, state.pageIndex + 1);
        state.selectedId = null;
        await PDFEngine.renderCurrentPage();
      });

      dom.btnZoomIn.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        state.zoom = clamp(state.zoom + 0.1, 0.5, 2.5);
        await PDFEngine.renderCurrentPage();
      });

      dom.btnZoomOut.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        state.zoom = clamp(state.zoom - 0.1, 0.5, 2.5);
        await PDFEngine.renderCurrentPage();
      });

      dom.stampInput.addEventListener("change", async () => {
        if (!state.pdfDoc) { dom.stampInput.value = ""; return; }
        const f = dom.stampInput.files?.[0];
        if (!f) return;
        const dataUrl = await fileToDataUrl(f);
        let png = dataUrl;
        if (f.type === "image/svg+xml") png = await svgDataUrlToPngDataUrl(dataUrl, 768);
        await addImageAnno("stamp", png, 240, 240);
        dom.stampInput.value = "";
      });

      dom.btnAddBuiltinStamp.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        await addImageAnno("stamp", await builtinStampDataUrl(), 240, 240);
      });

      dom.btnAddSign.addEventListener("click", () => {
        if (!state.pdfDoc) return;
        SignaturePad.open();
      });

      dom.btnAddText.addEventListener("click", () => {
        if (!state.pdfDoc) return;
        addTextAnno("簽名：");
      });

      dom.btnAddRect.addEventListener("click", () => {
        if (!state.pdfDoc) return;
        addRectAnno();
      });

      dom.btnUndo.addEventListener("click", () => undo());
      dom.btnRedo.addEventListener("click", () => redo());

      dom.btnExport.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        dom.btnExport.disabled = true;
        try {
          await Exporter.exportPdf();
        } catch (err) {
          const msg = (err && err.message) ? err.message : String(err);
          alert(`匯出 PDF 失敗：${msg}`);
          console.error("Export PDF failed:", err);
        }
        finally { dom.btnExport.disabled = false; }
      });

      dom.btnSignClose.addEventListener("click", () => SignaturePad.close());
      dom.btnSignClear.addEventListener("click", () => SignaturePad.clear());
      dom.btnSignUse.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        await addImageAnno("signature", SignaturePad.getPngDataUrl(), 320, 140, true);
        SignaturePad.close();
      });

      dom.opacityRange.addEventListener("input", () => this.applyOpacity());
      dom.rotateRange.addEventListener("input", () => this.applyRotate());
      dom.colorInput.addEventListener("input", () => this.applyColor());
      dom.thicknessRange.addEventListener("input", () => this.applyThickness());

      dom.btnDelete.addEventListener("click", () => this.deleteSelected());
      dom.btnLock.addEventListener("click", () => this.toggleLock());
      dom.btnBringFront.addEventListener("click", () => this.bringFront());
      dom.btnSendBack.addEventListener("click", () => this.sendBack());
    },

    updateLabels() {
      dom.pageLabel.textContent = state.pdfDoc ? `${state.pageIndex + 1} / ${state.pageCount}` : "- / -";
      dom.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    },

    updateButtons() {
      const has = !!state.pdfDoc;
      dom.btnPrev.disabled = !has || state.pageIndex === 0;
      dom.btnNext.disabled = !has || state.pageIndex === state.pageCount - 1;
      dom.btnUndo.disabled = state.history.undo.length === 0;
      dom.btnRedo.disabled = state.history.redo.length === 0;
      dom.btnExport.disabled = !has;
    },

    syncInspector() {
      const a = getSelected();
      if (!a) {
        dom.opacityRange.value = "1";
        dom.opacityLabel.textContent = "1.00";
        dom.rotateRange.value = "0";
        dom.rotateLabel.textContent = "0°";
        dom.colorInput.value = "#111111";
        dom.colorLabel.textContent = "#111111";
        dom.thicknessRange.value = "4";
        dom.thicknessLabel.textContent = "4";
        dom.colorInput.disabled = true;
        dom.thicknessRange.disabled = true;
        return;
      }
      const op = a.opacity ?? 1;
      dom.opacityRange.value = String(op);
      dom.opacityLabel.textContent = op.toFixed(2);
      const rot = a.rotation ?? 0;
      dom.rotateRange.value = String(rot);
      dom.rotateLabel.textContent = `${Math.round(rot)}°`;

      const canColor = a.type === "text" || a.type === "rect";
      dom.colorInput.disabled = !canColor;
      dom.thicknessRange.disabled = a.type !== "rect";

      const color = normalizeHexColor(a.color, a.type === "rect" ? "#d10000" : "#111111");
      dom.colorInput.value = color;
      dom.colorLabel.textContent = color;

      const stroke = String(Math.max(1, Math.round(a.strokeWidth || 4)));
      dom.thicknessRange.value = stroke;
      dom.thicknessLabel.textContent = stroke;
    },

    applyOpacity() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.opacity = parseFloat(dom.opacityRange.value);
      dom.opacityLabel.textContent = (a.opacity ?? 1).toFixed(2);
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },

    applyRotate() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.rotation = parseFloat(dom.rotateRange.value);
      dom.rotateLabel.textContent = `${Math.round(a.rotation)}°`;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },

    applyColor() {
      const a = getSelected();
      if (!a || a.locked) return;
      if (a.type !== "text" && a.type !== "rect") return;
      const before = snapshotAnno(a);
      a.color = normalizeHexColor(dom.colorInput.value, a.type === "rect" ? "#d10000" : "#111111");
      dom.colorLabel.textContent = a.color;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },

    applyThickness() {
      const a = getSelected();
      if (!a || a.locked || a.type !== "rect") return;
      const before = snapshotAnno(a);
      a.strokeWidth = clamp(parseInt(dom.thicknessRange.value, 10) || 1, 1, 24);
      dom.thicknessLabel.textContent = String(a.strokeWidth);
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },

    deleteSelected() {
      const a = getSelected();
      if (!a || a.locked) return;
      const snap = snapshotAnno(a);
      const cmd = cmdRemoveAnno(a.id, snap);
      cmd.do(); pushCommand(cmd);
      OverlayEngine.render();
      this.syncInspector();
    },

    toggleLock() {
      const a = getSelected();
      if (!a) return;
      const before = snapshotAnno(a);
      a.locked = !a.locked;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
      this.syncInspector();
    },

    bringFront() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.zIndex = Date.now();
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },

    sendBack() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.zIndex = 0;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },
  };

  // fix sign pos y
  SignaturePad.pos = (ev) => {
    const r = dom.signCanvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  // overlay blank click => deselect
  dom.overlay.addEventListener("pointerdown", (ev) => {
    if (ev.target === dom.overlay) {
      state.selectedId = null;
      OverlayEngine.render();
      UI.syncInspector();
    }
  });

  // boot
  SignaturePad.init();
  UI.bind();
  UI.updateLabels();
  UI.updateButtons();

})();