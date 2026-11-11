/* =========================================================
   SOONTORN-PDF-2027  —  AXIS INNOVATION CO.,LTD.
   โปรแกรม PDF ใช้งานภายในองค์กร (ทำงานออฟไลน์ทั้งหมด)
   ========================================================= */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const { PDFDocument, degrees } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

const APP_VERSION = '1.1.5';
const PT_M = 0.0254 / 72;               // 1 point = 0.3528 มม. บนกระดาษ
const DEFAULT_RATIO = 100;               // ถ้ายังไม่ตั้งสเกล ใช้ 1:100
const TYPE_TH = { length: 'ความยาว', polyline: 'ระยะต่อเนื่อง', area: 'พื้นที่', count: 'นับจำนวน', calibrate: 'ตั้งสเกล' };
const TYPE_COLOR = { length: '#e53935', polyline: '#fb8c00', area: '#1e88e5', count: '#8e24aa', calibrate: '#00897b' };
const COUNT_COLORS = ['#8e24aa', '#d81b60', '#00897b', '#6d4c41', '#3949ab', '#c0ca33', '#f4511e'];
const TOOL_HINT = {
  select: 'คลิกเส้นวัดเพื่อเลือก · ลากเพื่อเลื่อนหน้า · Ctrl+ล้อเมาส์ = ย่อ/ขยาย',
  calibrate: 'คลิก 2 จุดบนระยะที่ทราบค่าในแบบ แล้วกรอกระยะจริง (เมตร)',
  length: 'คลิกจุดเริ่มต้นและจุดสิ้นสุด · กด Shift = ล็อกแนวตั้ง/แนวนอน',
  polyline: 'คลิกทีละจุด · ดับเบิลคลิก / Enter / คลิกขวา = จบ · Esc = ยกเลิก',
  area: 'คลิกรอบพื้นที่ทีละมุม · ดับเบิลคลิก / Enter / คลิกขวา = ปิดรูป · Esc = ยกเลิก',
  count: 'คลิกบนสิ่งที่ต้องการนับทีละจุด · Enter / คลิกขวา = จบกลุ่ม · ตั้งชื่อกลุ่มในรายการด้านขวา',
};

/* ---------- ไอคอน ---------- */
const ICONS = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  folderIn: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10v6M9 13l3 3 3-3"/>',
  save: '<path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8V3M7 21v-7h10v7"/>',
  saveAs: '<path d="M5 3h11l3 3v6M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2"/><path d="M7 3v5h8V3"/><path d="M18 15v6M15 18h6"/>',
  disk: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v5h8V4M8 14h8M8 17h5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  combine: '<rect x="3" y="3" width="8" height="10" rx="1"/><rect x="13" y="3" width="8" height="10" rx="1"/><path d="M7 13v3h10v-3M12 16v5M9 19l3 3 3-3"/>',
  pageX: '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M10 12l5 5M15 12l-5 5"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  rotL: '<path d="M4 11a8 8 0 1 1 2.3 5.7"/><path d="M4 4v7h7"/>',
  rotR: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  excel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  word: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8l2 8 3-6 3 6 2-8"/>',
  report: '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M9 18v-4M12 18v-7M15 18v-2"/>',
  pointer: '<path d="M5 3l14 8-6 2-2 6z"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  length: '<path d="M6 18L18 6"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/>',
  polyline: '<path d="M3 18l6-8 5 5 7-10"/><circle cx="3" cy="18" r="1.5"/><circle cx="21" cy="5" r="1.5"/>',
  area: '<path d="M4 8l8-5 8 5-3 12H7z"/><path d="M8 12h8M9 16h6" opacity=".6"/>',
  count: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="17" r="3"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M9 9l-5-5M15 9l5-5M9 15l-5 5M15 15l5 5"/>',
  cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  chevUp: '<path d="M6 15l6-6 6 6"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
function applyIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    if (el.dataset.iconDone) return;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
    el.dataset.iconDone = '1';
  });
}

/* ---------- สถานะโปรแกรม ---------- */
const S = {
  files: [], activeId: null, page: 1, zoom: 1, fit: true,
  pageW: 0, pageH: 0, tool: 'select', draft: null, selId: null,
  meas: [], seq: 1, cursor: null,
};
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_TOUCH = (navigator.maxTouchPoints || 0) > 0;
const active = () => S.files.find(f => f.id === S.activeId) || null;
const fileById = id => S.files.find(f => f.id === id);
const mpp = f => (f && f.mPerPt) || DEFAULT_RATIO * PT_M;
const measOf = (f, page) => S.meas.filter(m => m.fileId === f.id && (page == null || m.page === page));

/* ---------- เครื่องมือช่วย ---------- */
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
function busy(on, msg = 'กำลังทำงาน...') { $('#busy').hidden = !on; $('#busyMsg').textContent = msg; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 2) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d });
const baseName = n => n.replace(/\.pdf$/i, '');
const today = () => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; };

function ask(title, bodyHtml, okText = 'ตกลง') {
  const dlg = $('#dlg');
  $('#dlgTitle').textContent = title;
  $('#dlgBody').innerHTML = bodyHtml;
  $('#dlgOk').textContent = okText;
  dlg.returnValue = ''; $('#dlgAlt').hidden = true;
  dlg.showModal();
  const first = $('#dlgBody input, #dlgBody select');
  if (first) { first.focus(); first.select && first.select(); }
  return new Promise(res => { dlg.onclose = () => res(dlg.returnValue === 'ok' ? $('#dlgBody') : null); });
}

async function saveBlob(blob, name, types, holder) {
  if (window.showSaveFilePicker) {
    try {
      let h = holder && holder.saveHandle;
      if (!h) {
        h = await window.showSaveFilePicker({ suggestedName: name, types });
        if (holder) holder.saveHandle = h;
      }
      const w = await h.createWritable(); await w.write(blob); await w.close();
      toast('บันทึกแล้ว: ' + h.name);
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.warn('ใช้การดาวน์โหลดแทน:', e);
    }
  }
  // iPad / iPhone: เปิดหน้าต่างแชร์ ให้เลือก "บันทึกไปยังแอป Files" หรือส่งต่อทาง LINE / อีเมล
  if (IS_IOS && navigator.canShare) {
    try {
      const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        toast('ส่งออกแล้ว: ' + name);
        return true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.warn('share ไม่สำเร็จ ใช้การดาวน์โหลดแทน:', e);
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast(IS_IOS ? `ดาวน์โหลดแล้ว: ${name} (ดูได้ในแอป Files > ดาวน์โหลด)` : 'บันทึกไฟล์แล้ว (โฟลเดอร์ดาวน์โหลด): ' + name, 4500);
  return true;
}
const T_PDF = [{ description: 'ไฟล์ PDF', accept: { 'application/pdf': ['.pdf'] } }];
const T_XLSX = [{ description: 'ไฟล์ Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }];
const T_DOCX = [{ description: 'ไฟล์ Word', accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] } }];
const T_JSON = [{ description: 'งานวัด SOONTORN-PDF', accept: { 'application/json': ['.json'] } }];

/* =========================================================
   จัดการไฟล์ PDF
   ========================================================= */
async function loadDoc(bytes) {
  return pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
}
async function addPdf(name, bytes, select = true) {
  const doc = await loadDoc(bytes);
  const f = { id: 'f' + S.seq++, name, bytes, doc, numPages: doc.numPages, mPerPt: null, scaleLabel: '', checked: true, saveHandle: null };
  S.files.push(f);
  if (select) setActive(f.id); else refreshAll();
  return f;
}
async function reloadFile(f, bytes) {
  const old = f.doc;
  f.bytes = bytes;
  f.doc = await loadDoc(bytes);
  f.numPages = f.doc.numPages;
  old && old.destroy();
  $('#pdfCanvas').dataset.key = '';   // บังคับวาดหน้าใหม่
}
async function openFiles(list) {
  const pdfs = [...list].filter(x => /\.pdf$/i.test(x.name) || x.type === 'application/pdf');
  if (!pdfs.length) return toast('กรุณาเลือกไฟล์ PDF');
  busy(true, 'กำลังเปิดไฟล์...');
  try {
    for (let i = 0; i < pdfs.length; i++) {
      const bytes = new Uint8Array(await pdfs[i].arrayBuffer());
      await addPdf(pdfs[i].name, bytes, i === pdfs.length - 1);
    }
    toast(`เปิดไฟล์แล้ว ${pdfs.length} ไฟล์`);
  } catch (e) {
    console.error(e); toast('เปิดไฟล์ไม่สำเร็จ: ' + e.message, 5000);
  } finally { busy(false); }
}

function setActive(id) {
  S.activeId = id; S.page = 1; S.fit = true; S.draft = null; S.selId = null;
  refreshAll();
}
function refreshAll() {
  document.body.classList.toggle('has-file', !!active());
  renderTabs(); renderFileList(); renderThumbs(); renderPage(); renderMeasList(); renderScaleUI();
}

function renderTabs() {
  const el = $('#tabs');
  el.innerHTML = S.files.map(f => `
    <div class="tab ${f.id === S.activeId ? 'active' : ''}" data-id="${f.id}" title="${esc(f.name)}">
      <span>${esc(f.name)}</span><button class="x" data-close="${f.id}" title="ปิดไฟล์">✕</button>
    </div>`).join('');
}
function renderFileList() {
  const el = $('#fileList');
  if (!S.files.length) { el.innerHTML = '<li class="empty-li">ยังไม่มีไฟล์ — กด "เปิด PDF"</li>'; return; }
  el.innerHTML = S.files.map((f, i) => `
    <li class="${f.id === S.activeId ? 'active' : ''}" data-id="${f.id}">
      <input type="checkbox" data-chk="${f.id}" ${f.checked ? 'checked' : ''} title="เลือกเพื่อรวมไฟล์">
      <span class="nm" title="${esc(f.name)}">${i + 1}. ${esc(f.name)}</span>
      <span class="pg">${f.numPages} หน้า</span>
    </li>`).join('');
}

async function removeFile(id) {
  const f = fileById(id); if (!f) return;
  const n = measOf(f).length;
  const ok = await ask('ลบไฟล์ออกจากรายการ',
    `<p>ต้องการลบ <b>${esc(f.name)}</b> ออกจากโปรแกรมหรือไม่?</p>
     ${n ? `<p style="color:var(--danger)">รายการวัด ${n} รายการของไฟล์นี้จะถูกลบด้วย</p>` : ''}
     <p class="muted small">ไฟล์ต้นฉบับในเครื่องจะไม่ถูกลบ</p>`, 'ลบไฟล์');
  if (!ok) return;
  S.meas = S.meas.filter(m => m.fileId !== id);
  const idx = S.files.indexOf(f);
  S.files.splice(idx, 1);
  f.doc && f.doc.destroy();
  if (S.activeId === id) {
    const next = S.files[Math.min(idx, S.files.length - 1)];
    setActive(next ? next.id : null);
  } else refreshAll();
  toast('ลบไฟล์ออกจากรายการแล้ว');
}

/* =========================================================
   แสดงผลหน้า PDF
   ========================================================= */
let renderTask = null, renderToken = 0;
function fitZoom() {
  const v = $('#viewer');
  return Math.max(0.05, Math.min((v.clientWidth - 48) / S.pageW, (v.clientHeight - 48) / S.pageH));
}
// ขีดจำกัดหน่วยความจำของ canvas — iPad/Safari ปิดหน้าเว็บทิ้งถ้า canvas ใหญ่เกิน
const MAX_ZOOM = IS_IOS ? 6 : 8;
const PDF_MAX_PX = IS_IOS ? 6e6 : 24e6;      // ภาพหน้าแบบ
const OV_MAX_PX = IS_IOS ? 3e6 : 12e6;       // ชั้นเส้นวัด
const capScale = (want, maxPx) => Math.min(want, Math.sqrt(maxPx / (S.pageW * S.pageH)));
// cssOnly = true ระหว่างถ่าง/หุบนิ้ว: เปลี่ยนแค่ขนาดที่แสดง ไม่จองหน่วยความจำใหม่ทุกครั้งที่นิ้วขยับ
function sizeCanvases(cssOnly) {
  const dpr = window.devicePixelRatio || 1;
  const w = S.pageW * S.zoom, h = S.pageH * S.zoom;
  const wrap = $('#pageWrap');
  wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
  for (const c of [$('#pdfCanvas'), $('#overlay')]) { c.style.width = w + 'px'; c.style.height = h + 'px'; }
  $('#zoomLbl').textContent = Math.round(S.zoom * 100) + '%';
  if (cssOnly) return;
  const ov = $('#overlay'), k = capScale(S.zoom * dpr, OV_MAX_PX);
  const ow = Math.max(1, Math.round(S.pageW * k)), oh = Math.max(1, Math.round(S.pageH * k));
  if (ov.width !== ow || ov.height !== oh) { ov.width = ow; ov.height = oh; }
}
let offCanvas = null;   // ใช้ซ้ำ ไม่สร้างใหม่ทุกครั้ง
async function renderPage() {
  const f = active();
  $('#pageTotal').textContent = '/ ' + (f ? f.numPages : 0);
  $('#pageInput').value = f ? S.page : 1;
  if (!f) { $('#stHint').textContent = 'เปิดไฟล์ PDF เพื่อเริ่มงาน'; return; }
  const token = ++renderToken;
  const page = await f.doc.getPage(S.page);
  if (token !== renderToken) return;
  const vp1 = page.getViewport({ scale: 1 });
  S.pageW = vp1.width; S.pageH = vp1.height;
  if (S.fit) S.zoom = fitZoom();
  sizeCanvases(); drawOverlay();
  const dpr = window.devicePixelRatio || 1;
  const scale = capScale(S.zoom * dpr, PDF_MAX_PX);
  const vp = page.getViewport({ scale });
  const c = $('#pdfCanvas');
  const W = Math.floor(vp.width), Hh = Math.floor(vp.height);
  // ถ้าความละเอียดเท่าเดิม (เช่นซูมเกินขีดจำกัดแล้ว) ไม่ต้องวาดใหม่
  if (c.width === W && c.height === Hh && c.dataset.key === `${f.id}:${S.page}`) return;
  if (renderTask) { try { renderTask.cancel(); } catch (_) {} }
  const off = offCanvas || (offCanvas = document.createElement('canvas'));
  off.width = W; off.height = Hh;
  renderTask = page.render({ canvasContext: off.getContext('2d'), viewport: vp });
  try { await renderTask.promise; } catch (e) { if (e && e.name === 'RenderingCancelledException') return; console.error(e); return; }
  if (token !== renderToken) return;
  if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
  c.getContext('2d').drawImage(off, 0, 0);
  c.dataset.key = `${f.id}:${S.page}`;
  if (IS_IOS) { off.width = 1; off.height = 1; }   // คืนหน่วยความจำทันที
  $$('.thumb').forEach(t => t.classList.toggle('active', +t.dataset.p === S.page));
}
function goPage(n) {
  const f = active(); if (!f) return;
  n = Math.max(1, Math.min(f.numPages, n | 0));
  if (n === S.page) return;
  S.page = n; S.draft = null; S.selId = null;
  renderPage(); renderMeasList();
  const t = $(`.thumb[data-p="${n}"]`); t && t.scrollIntoView({ block: 'nearest' });
}
function setZoom(z, cx, cy) {
  if (!active()) return;
  const v = $('#viewer');
  z = Math.max(0.05, Math.min(MAX_ZOOM, z));
  const wrap = $('#pageWrap').getBoundingClientRect();
  const vr = v.getBoundingClientRect();
  if (cx == null) { cx = vr.left + vr.width / 2; cy = vr.top + vr.height / 2; }
  const px = (cx - wrap.left) / S.zoom, py = (cy - wrap.top) / S.zoom;
  S.fit = false; S.zoom = z;
  sizeCanvases(true);   // ระหว่างซูม: แค่ยืดภาพเดิม
  const nw = $('#pageWrap').getBoundingClientRect();
  v.scrollLeft += (nw.left + px * z) - cx;
  v.scrollTop += (nw.top + py * z) - cy;
  clearTimeout(setZoom._t);
  setZoom._t = setTimeout(() => { sizeCanvases(); drawOverlay(); renderPage(); }, pinch ? 250 : 120);
}

/* ---------- ภาพย่อหน้า ---------- */
let thumbToken = 0;
async function renderThumbs() {
  const f = active(), box = $('#thumbs');
  const token = ++thumbToken;
  box.innerHTML = '';
  $('#pageCountLbl').textContent = f ? `${f.numPages} หน้า` : '';
  if (!f) return;
  const items = [];
  for (let p = 1; p <= f.numPages; p++) {
    const d = document.createElement('div');
    d.className = 'thumb' + (p === S.page ? ' active' : ''); d.dataset.p = p;
    d.innerHTML = `<canvas></canvas><div>${p}</div>`;
    box.appendChild(d); items.push(d);
  }
  for (const d of items) {
    if (token !== thumbToken) return;
    const page = await f.doc.getPage(+d.dataset.p);
    const vp1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 220 / vp1.width });
    const c = $('canvas', d); c.width = vp.width; c.height = vp.height;
    try { await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; } catch (_) {}
  }
}

/* =========================================================
   การวัด: คำนวณและวาด
   ========================================================= */
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polyLen = pts => pts.slice(1).reduce((s, p, i) => s + dist(pts[i], p), 0);
function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}
function centroid(pts) {
  let x = 0, y = 0; pts.forEach(p => { x += p[0]; y += p[1]; });
  return [x / pts.length, y / pts.length];
}
function measValue(m) {
  const k = mpp(fileById(m.fileId));
  if (m.type === 'length' || m.type === 'polyline') return { v: polyLen(m.pts) * k, unit: 'ม.' };
  if (m.type === 'area') return { v: polyArea(m.pts) * k * k, unit: 'ตร.ม.', perim: polyLen([...m.pts, m.pts[0]]) * k };
  if (m.type === 'count') return { v: m.pts.length, unit: m.unit || 'จุด' };
  return { v: polyLen(m.pts) * k, unit: 'ม.' };
}
const valText = m => { const r = measValue(m); return (m.type === 'count' ? r.v : fmt(r.v)) + ' ' + r.unit; };

function label(ctx, text, x, y, u, color) {
  ctx.font = `600 ${12 * u}px "Leelawadee UI", Thonburi, Tahoma, sans-serif`;
  const w = ctx.measureText(text).width, h = 16 * u, pad = 4 * u;
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.strokeStyle = color; ctx.lineWidth = 1 * u;
  ctx.beginPath(); ctx.rect(x - w / 2 - pad, y - h / 2, w + pad * 2, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5 * u);
}
// u = ขนาด 1 พิกเซลบนจอ ในหน่วยของหน้า (point)
function drawMeas(ctx, m, u, selected, cursor) {
  const pts = cursor ? [...m.pts, cursor] : m.pts;
  if (!pts.length) return;
  const col = m.color || TYPE_COLOR[m.type];
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (m.type === 'count') {
    m.pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p[0], p[1], (selected ? 9 : 7.5) * u, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.lineWidth = 1.5 * u; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${9 * u}px Tahoma, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p[0], p[1] + 0.5 * u);
    });
    if (cursor) { ctx.beginPath(); ctx.arc(cursor[0], cursor[1], 7.5 * u, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = 1.5 * u; ctx.stroke(); }
    if (m.pts.length) label(ctx, `${m.name || 'นับ'}: ${m.pts.length} ${m.unit || 'จุด'}`, m.pts[0][0], m.pts[0][1] - 20 * u, u, col);
    return;
  }
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  if (m.type === 'area' && pts.length > 2) {
    ctx.closePath();
    ctx.fillStyle = col + (selected ? '55' : '33'); ctx.fill();
  }
  ctx.strokeStyle = col; ctx.lineWidth = (selected ? 3.5 : 2) * u;
  if (m.type === 'calibrate') ctx.setLineDash([6 * u, 4 * u]);
  ctx.stroke(); ctx.setLineDash([]);
  pts.forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 3 * u, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.5 * u; ctx.strokeStyle = col; ctx.stroke(); });
  if (pts.length < 2) return;
  const tmp = { ...m, pts };
  let text, at;
  if (m.type === 'area') {
    if (pts.length < 3) return;
    text = `${m.name || 'พื้นที่'}: ${valText(tmp)}`; at = centroid(pts);
  } else {
    text = m.type === 'calibrate' ? `${fmt(polyLen(pts), 1)} pt` : `${m.name || TYPE_TH[m.type]}: ${valText(tmp)}`;
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    at = m.type === 'length' || m.type === 'calibrate' ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 14 * u] : [b[0], b[1] - 16 * u];
  }
  label(ctx, text, at[0], at[1], u, col);
}
function drawOverlay() {
  const f = active(), ov = $('#overlay');
  const ctx = ov.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ov.width, ov.height);
  if (!f) return;
  const k = ov.width / S.pageW;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const u = 1 / S.zoom;
  measOf(f, S.page).forEach(m => drawMeas(ctx, m, u, m.id === S.selId));
  if (S.draft) drawMeas(ctx, S.draft, u, true, S.cursor);
  updateDrawBar();
}

/* ---------- เมาส์บนหน้า ---------- */
function pagePt(e) {
  const r = $('#overlay').getBoundingClientRect();
  return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom];
}
function ortho(p, e) {
  if ((!e.shiftKey && !S.ortho) || !S.draft || !S.draft.pts.length || S.tool === 'count') return p;
  const last = S.draft.pts[S.draft.pts.length - 1];
  return Math.abs(p[0] - last[0]) > Math.abs(p[1] - last[1]) ? [p[0], last[1]] : [last[0], p[1]];
}
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}
function inPoly(p, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function hitTest(p, touch) {
  const f = active(); const tol = (touch ? 16 : 7) / S.zoom;
  const list = measOf(f, S.page).reverse();
  for (const m of list) {
    if (m.type === 'count') { if (m.pts.some(q => dist(p, q) < tol * 1.4)) return m.id; continue; }
    const pts = m.type === 'area' ? [...m.pts, m.pts[0]] : m.pts;
    for (let i = 1; i < pts.length; i++) if (segDist(p, pts[i - 1], pts[i]) < tol) return m.id;
  }
  for (const m of list) if (m.type === 'area' && inPoly(p, m.pts)) return m.id;
  return null;
}

function setTool(t) {
  if (S.draft && S.tool !== t) finishDraft();
  S.tool = t; S.draft = null;
  $$('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  $('#overlay').style.cursor = t === 'select' ? 'grab' : 'crosshair';
  $('#stTool').textContent = 'เครื่องมือ: ' + (t === 'select' ? 'เลือก' : TYPE_TH[t]);
  $('#stHint').textContent = TOOL_HINT[t];
  if (t !== 'select' && !active()) toast('กรุณาเปิดไฟล์ PDF ก่อน');
  drawOverlay();
}

let pan = null;
function onDown(e) {
  const f = active(); if (!f) return;
  $('#viewer').focus({ preventScroll: true });
  if (e.button === 1 || (e.button === 0 && S.tool === 'select')) {
    if (e.button === 0) {
      const id = hitTest(pagePt(e));
      if (id) { S.selId = id; drawOverlay(); renderMeasList(); scrollToMeas(id); return; }
      if (S.selId) { S.selId = null; drawOverlay(); renderMeasList(); }
    }
    const v = $('#viewer');
    pan = { x: e.clientX, y: e.clientY, sl: v.scrollLeft, st: v.scrollTop };
    $('#overlay').style.cursor = 'grabbing';
    e.preventDefault(); return;
  }
  if (e.button === 2) { e.preventDefault(); finishDraft(); return; }
  if (e.button !== 0) return;
  addPoint(ortho(pagePt(e), e), 0.5);
}
// เพิ่มจุดวัด (ใช้ร่วมกันทั้งเมาส์ นิ้ว และปากกา) — minPx = ระยะขั้นต่ำจากจุดก่อนหน้า (พิกเซลบนจอ)
function addPoint(p, minPx) {
  const f = active(); if (!f) return;
  if (!S.draft) {
    S.draft = { type: S.tool, pts: [], fileId: f.id, page: S.page };
    if (S.tool === 'count') {
      const n = measOf(f).filter(m => m.type === 'count').length;
      S.draft.color = COUNT_COLORS[n % COUNT_COLORS.length];
    }
  }
  const last = S.draft.pts[S.draft.pts.length - 1];
  if (last && dist(last, p) < minPx / S.zoom) return;
  S.draft.pts.push(p);
  S.cursor = null;
  if ((S.tool === 'length' || S.tool === 'calibrate') && S.draft.pts.length === 2) finishDraft();
  drawOverlay();
}

/* ---------- นิ้วสัมผัส / Apple Pencil: แตะ = ใส่จุด, ลาก = เลื่อน, 2 นิ้ว = ย่อ/ขยาย ---------- */
const touchPts = new Map();
let pinch = null, tap = null;
function onPointerDown(e) {
  if (e.pointerType === 'mouse' || !active()) return;
  e.preventDefault();
  try { $('#overlay').setPointerCapture(e.pointerId); } catch (_) {}
  touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touchPts.size === 2) {
    // สองนิ้ว = ย่อ/ขยาย และเลื่อนหน้าไปพร้อมกัน — ถ้านิ้วแรกเพิ่งปักหมุดไป ให้เอาหมุดนั้นออก
    if (tap && tap.added && S.draft) { S.draft.pts.pop(); if (!S.draft.pts.length) S.draft = null; S.cursor = null; drawOverlay(); }
    const [a, b] = [...touchPts.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: S.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    tap = null; pan = null; return;
  }
  if (touchPts.size > 2) return;
  const v = $('#viewer');
  tap = { x: e.clientX, y: e.clientY, moved: false, added: false };
  if (S.tool === 'select') {
    // โหมดเลือก: นิ้วเดียวลากเพื่อเลื่อนหน้า
    pan = { x: e.clientX, y: e.clientY, sl: v.scrollLeft, st: v.scrollTop, touch: true };
    return;
  }
  // โหมดวัด: กดปากกา/นิ้วลง = ปักหมุดทันที
  pan = null;
  const n0 = S.draft ? S.draft.pts.length : 0;
  addPoint(ortho(pagePt(e), e), 6);
  tap.added = !!S.draft && S.draft.pts.length > n0;
}
const ptAt = (x, y) => { const r = $('#overlay').getBoundingClientRect(); return [(x - r.left) / S.zoom, (y - r.top) / S.zoom]; };
function onPointerMove(e) {
  if (e.pointerType === 'mouse' || !touchPts.has(e.pointerId)) return;
  touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && touchPts.size >= 2) {
    const [a, b] = [...touchPts.values()];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, mx, my);
    const v = $('#viewer');
    v.scrollLeft -= mx - pinch.mx; v.scrollTop -= my - pinch.my;   // เลื่อนตามการขยับของสองนิ้ว
    pinch.mx = mx; pinch.my = my;
    return;
  }
  if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap.moved = true;
  if (pan && tap && tap.moved) {
    const v = $('#viewer');
    v.scrollLeft = pan.sl - (e.clientX - pan.x); v.scrollTop = pan.st - (e.clientY - pan.y);
    return;
  }
  // โหมดวัด: ระหว่างลาก เส้นจะวิ่งตามปากกา พร้อมแสดงค่า
  if (tap && S.draft && S.tool !== 'count') {
    S.cursor = ortho(pagePt(e), e);
    drawOverlay();
    if (S.tool !== 'calibrate') $('#stHint').textContent = `${TYPE_TH[S.tool]}: ${valText({ ...S.draft, pts: [...S.draft.pts, S.cursor] })}`;
  }
}
function onPointerUp(e) {
  if (e.pointerType === 'mouse' || !touchPts.has(e.pointerId)) return;
  touchPts.delete(e.pointerId);
  if (pinch) { if (touchPts.size < 2) pinch = null; tap = null; pan = null; return; }
  pan = null;
  // iPad มักส่ง pointercancel แทน pointerup เมื่อกดปากกาค้างไว้ (ระบบคิดว่าเป็นท่าค้าง) จึงถือเป็นการปล่อยด้วย
  const released = e.type === 'pointerup' || e.type === 'pointercancel';
  if (released && tap && S.tool !== 'select') {
    // ปล่อยปากกาหลังลาก = ปักหมุดที่สอง (ตั้งสเกล/ความยาว จะจบและถามระยะจริงทันที)
    // ถ้าแค่แตะ (ไม่ได้ลาก) หมุดถูกปักไปแล้วตอนกดลง — แตะจุดถัดไปได้เลย
    if (tap.moved && S.tool !== 'count') addPoint(ortho(pagePt(e), e), 6);
    S.cursor = null; drawOverlay();
  } else if (released && tap && !tap.moved && S.tool === 'select') {
    S.selId = hitTest(pagePt(e), true); drawOverlay(); renderMeasList(); S.selId && scrollToMeas(S.selId);
  }
  tap = null;
}

/* ---------- แถบควบคุมการวัด (สำหรับ iPad และผู้ใช้ทั่วไป) ---------- */
function updateDrawBar() {
  const bar = $('#drawBar');
  const show = !!active() && S.tool !== 'select';
  bar.hidden = !show;
  if (!show) return;
  const n = S.draft ? S.draft.pts.length : 0;
  let info = TYPE_TH[S.tool] + (n ? ` · ${n} จุด` : ' · แตะ/คลิกบนแบบเพื่อเริ่ม');
  if (S.draft && n >= 2 && S.tool !== 'count' && S.tool !== 'calibrate') info = `${TYPE_TH[S.tool]}: ${valText(S.draft)}`;
  if (S.draft && S.tool === 'count') info = `นับแล้ว ${n} จุด`;
  $('#drawInfo').textContent = info;
  $('[data-draw="undo"]').disabled = !n;
  $('[data-draw="finish"]').disabled = !n;
  $('[data-draw="cancel"]').disabled = !n;
  $('#btnOrtho').classList.toggle('active', !!S.ortho);
  $('#btnOrtho').hidden = S.tool === 'count';
}
function onMove(e) {
  if (pan && pan.touch) return;
  if (pan) {
    const v = $('#viewer');
    v.scrollLeft = pan.sl - (e.clientX - pan.x); v.scrollTop = pan.st - (e.clientY - pan.y);
    return;
  }
  if (!active()) return;
  const p = pagePt(e);
  const k = mpp(active());
  $('#stPos').textContent = `X ${fmt(p[0] * k)} ม. · Y ${fmt(p[1] * k)} ม.`;
  if (S.draft) {
    S.cursor = ortho(p, e);
    const tmp = { ...S.draft, pts: [...S.draft.pts, S.cursor] };
    if (S.tool !== 'count' && S.tool !== 'calibrate') $('#stHint').textContent = `${TYPE_TH[S.tool]}: ${valText(tmp)}`;
    drawOverlay();
  }
}
function onUp() {
  if (pan && !pan.touch) { pan = null; $('#overlay').style.cursor = S.tool === 'select' ? 'grab' : 'crosshair'; }
}

async function finishDraft() {
  const d = S.draft; S.draft = null; S.cursor = null;
  if (!d) return;
  const pts = d.pts;
  const need = { length: 2, calibrate: 2, polyline: 2, area: 3, count: 1 }[d.type];
  if (pts.length < need) { drawOverlay(); $('#stHint').textContent = TOOL_HINT[S.tool]; return; }
  const f = fileById(d.fileId);
  if (d.type === 'calibrate') {
    drawOverlay();
    const dpt = polyLen(pts);
    const r = await ask('ตั้งสเกลจากระยะจริง',
      `<p class="muted">ระยะที่ลากบนแบบ = ${fmt(dpt, 1)} point</p>
       <label>ระยะจริงในแบบ</label><input id="calLen" type="number" step="any" min="0" value="1.00">
       <label>หน่วย</label><select id="calUnit"><option value="1">เมตร</option><option value="0.01">เซนติเมตร</option><option value="0.001">มิลลิเมตร</option></select>`);
    if (!r) return;
    const L = parseFloat($('#calLen', r).value) * parseFloat($('#calUnit', r).value);
    if (!(L > 0)) return toast('ระยะจริงไม่ถูกต้อง');
    f.mPerPt = L / dpt;
    f.scaleLabel = `ตั้งสเกล (≈ 1:${Math.round(f.mPerPt / PT_M)})`;
    renderScaleUI(); renderMeasList(); drawOverlay();
    toast('ตั้งสเกลเรียบร้อย ค่าที่วัดทั้งหมดของไฟล์นี้คำนวณใหม่แล้ว');
    return;
  }
  const n = measOf(f).filter(m => m.type === d.type).length + 1;
  const m = {
    id: 'm' + S.seq++, fileId: d.fileId, page: d.page, type: d.type, pts,
    name: `${TYPE_TH[d.type]} ${n}`, color: d.color || TYPE_COLOR[d.type], unit: d.type === 'count' ? 'จุด' : undefined,
  };
  S.meas.push(m); S.selId = m.id;
  drawOverlay(); renderMeasList();
  $('#stHint').textContent = `เพิ่ม "${m.name}" = ${valText(m)}`;
}

/* ---------- รายการวัด (แผงขวา) ---------- */
function renderMeasList() {
  const f = active(), box = $('#measList'), sum = $('#summary');
  if (!f) { box.innerHTML = '<div class="meas-empty">ยังไม่มีไฟล์</div>'; sum.innerHTML = ''; return; }
  const all = measOf(f);
  const only = $('#onlyPage').checked;
  const list = only ? all.filter(m => m.page === S.page) : all;
  let L = 0, A = 0, C = 0;
  all.forEach(m => { const v = measValue(m).v; if (m.type === 'area') A += v; else if (m.type === 'count') C += v; else L += v; });
  sum.innerHTML = `
    <div class="sum-card"><small>ความยาวรวม</small><b>${fmt(L)}</b><small>เมตร</small></div>
    <div class="sum-card"><small>พื้นที่รวม</small><b>${fmt(A)}</b><small>ตารางเมตร</small></div>
    <div class="sum-card"><small>นับจำนวนรวม</small><b>${C}</b><small>จุด</small></div>
    <div class="sum-card"><small>รายการวัด</small><b>${all.length}</b><small>รายการ</small></div>`;
  if (!list.length) {
    box.innerHTML = `<div class="meas-empty">ยังไม่มีรายการวัด<br>เลือกเครื่องมือ <b>ความยาว</b>, <b>พื้นที่</b> หรือ <b>นับจำนวน</b> จากแถบด้านบน แล้วคลิกบนแบบ</div>`;
    return;
  }
  box.innerHTML = list.map(m => {
    const r = measValue(m);
    const sub = `หน้า ${m.page} · ${TYPE_TH[m.type]}${m.type === 'area' ? ` · รอบรูป ${fmt(r.perim)} ม.` : ''}`;
    return `<div class="meas ${m.id === S.selId ? 'sel' : ''}" data-id="${m.id}">
      <input type="color" class="dot" value="${m.color}" data-color="${m.id}" title="เปลี่ยนสี" style="width:12px;height:12px;padding:0;border:0;border-radius:50%;cursor:pointer;background:none">
      <input class="nm" value="${esc(m.name)}" data-name="${m.id}" title="แก้ชื่อรายการ">
      <span class="val">${valText(m)}</span>
      <button class="del" data-del="${m.id}" title="ลบรายการ">${icon('x')}</button>
      <span class="sub">${sub}</span>
    </div>`;
  }).join('');
}
function scrollToMeas(id) { const el = $(`.meas[data-id="${id}"]`); el && el.scrollIntoView({ block: 'nearest' }); }
function deleteMeas(id) {
  S.meas = S.meas.filter(m => m.id !== id);
  if (S.selId === id) S.selId = null;
  drawOverlay(); renderMeasList();
}

function renderScaleUI() {
  const f = active();
  const sel = $('#scaleSelect');
  if (!f) { sel.value = ''; $('#scaleInfo').textContent = '—'; return; }
  const ratio = f.mPerPt ? f.mPerPt / PT_M : null;
  const match = ratio && [...sel.options].find(o => o.value && Math.abs(+o.value - ratio) < 1e-6);
  sel.value = match ? match.value : '';
  $('#scaleInfo').textContent = f.mPerPt ? `สเกลปัจจุบัน: ${f.scaleLabel || '1:' + Math.round(ratio)}` : 'ยังไม่ได้ตั้งสเกล (ใช้ 1:100)';
}

/* =========================================================
   บันทึก / รวม / ลบหน้า / หมุนหน้า
   ========================================================= */
async function bakePdf(f) {
  const pdf = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const byPage = {};
  measOf(f).forEach(m => (byPage[m.page] = byPage[m.page] || []).push(m));
  for (const pn of Object.keys(byPage)) {
    const pj = await f.doc.getPage(+pn);
    const vp = pj.getViewport({ scale: 1 });
    const s = Math.min(3, (IS_IOS ? 4000 : 7000) / Math.max(vp.width, vp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width * s); c.height = Math.round(vp.height * s);
    const ctx = c.getContext('2d'); ctx.setTransform(s, 0, 0, s, 0, 0);
    byPage[pn].forEach(m => drawMeas(ctx, m, 1, false));
    const png = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer());
    const img = await pdf.embedPng(png);
    const p = pages[+pn - 1];
    const box = p.getCropBox();
    const W = box.width, H = box.height, cx = box.x, cy = box.y;
    const rot = ((p.getRotation().angle % 360) + 360) % 360;
    const pos = {
      0: { x: cx, y: cy, w: W, h: H },
      90: { x: cx + W, y: cy, w: H, h: W },
      180: { x: cx + W, y: cy + H, w: W, h: H },
      270: { x: cx, y: cy + H, w: H, h: W },
    }[rot] || { x: cx, y: cy, w: W, h: H };
    p.drawImage(img, { x: pos.x, y: pos.y, width: pos.w, height: pos.h, rotate: degrees(rot) });
  }
  return pdf.save();
}
async function saveActive(asNew) {
  const f = active(); if (!f) return toast('ยังไม่มีไฟล์ให้บันทึก');
  const has = measOf(f).length > 0;
  busy(true, 'กำลังเตรียมไฟล์ PDF...');
  try {
    const bytes = has ? await bakePdf(f) : f.bytes;
    busy(false);
    if (asNew) f.saveHandle = null;
    const name = has ? baseName(f.name) + '_วัดปริมาณ.pdf' : f.name;
    await saveBlob(new Blob([bytes], { type: 'application/pdf' }), name, T_PDF, f);
  } catch (e) { console.error(e); toast('บันทึกไม่สำเร็จ: ' + e.message, 5000); }
  finally { busy(false); }
}

async function combine() {
  const sel = S.files.filter(f => f.checked);
  if (sel.length < 2) return toast('ติ๊กเลือกไฟล์อย่างน้อย 2 ไฟล์ในแผงซ้าย แล้วกด "รวม PDF"', 4000);
  const anyMeas = sel.some(f => measOf(f).length);
  const r = await ask('รวมไฟล์ PDF',
    `<p>รวม ${sel.length} ไฟล์ตามลำดับ:</p><ol class="small">${sel.map(f => `<li>${esc(f.name)} (${f.numPages} หน้า)</li>`).join('')}</ol>
     <label>ชื่อไฟล์ใหม่</label><input id="cName" value="รวมไฟล์_${today()}.pdf">
     ${anyMeas ? '<label><input type="checkbox" id="cBake" checked style="width:auto"> รวมเส้นวัดที่วาดไว้ลงในไฟล์ด้วย</label>' : ''}`, 'รวมไฟล์');
  if (!r) return;
  let name = $('#cName', r).value.trim() || `รวมไฟล์_${today()}.pdf`;
  if (!/\.pdf$/i.test(name)) name += '.pdf';
  const bake = anyMeas && $('#cBake', r).checked;
  busy(true, 'กำลังรวมไฟล์...');
  try {
    const out = await PDFDocument.create();
    for (const f of sel) {
      const src = await PDFDocument.load(bake && measOf(f).length ? await bakePdf(f) : f.bytes, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach(p => out.addPage(p));
    }
    const bytes = await out.save();
    busy(false);
    const nf = await addPdf(name, bytes);
    nf.checked = false; renderFileList();
    toast(`รวมไฟล์สำเร็จ ${nf.numPages} หน้า — กด "บันทึก" เพื่อเก็บไฟล์`, 4000);
  } catch (e) { console.error(e); toast('รวมไฟล์ไม่สำเร็จ: ' + e.message, 5000); }
  finally { busy(false); }
}

async function deletePage() {
  const f = active(); if (!f) return;
  if (f.numPages <= 1) return toast('ไฟล์มีหน้าเดียว ลบหน้าไม่ได้ (ใช้ "ลบไฟล์" แทน)');
  const n = measOf(f, S.page).length;
  const ok = await ask('ลบหน้า', `<p>ลบหน้า <b>${S.page}</b> ของ ${esc(f.name)} ?</p>${n ? `<p style="color:var(--danger)">รายการวัดในหน้านี้ ${n} รายการจะถูกลบด้วย</p>` : ''}<p class="muted small">มีผลกับไฟล์ในโปรแกรม ต้องกด "บันทึก" เพื่อเก็บลงเครื่อง</p>`, 'ลบหน้า');
  if (!ok) return;
  busy(true, 'กำลังลบหน้า...');
  try {
    const pdf = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
    pdf.removePage(S.page - 1);
    await reloadFile(f, await pdf.save());
    const pg = S.page;
    S.meas = S.meas.filter(m => !(m.fileId === f.id && m.page === pg));
    S.meas.forEach(m => { if (m.fileId === f.id && m.page > pg) m.page--; });
    S.page = Math.min(pg, f.numPages); S.selId = null;
    renderFileList(); renderThumbs(); renderPage(); renderMeasList();
    toast(`ลบหน้า ${pg} แล้ว`);
  } catch (e) { console.error(e); toast('ลบหน้าไม่สำเร็จ: ' + e.message, 5000); }
  finally { busy(false); }
}

async function rotatePage() {
  const f = active(); if (!f) return;
  busy(true, 'กำลังหมุนหน้า...');
  try {
    const pdf = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
    const p = pdf.getPage(S.page - 1);
    p.setRotation(degrees((p.getRotation().angle + 90) % 360));
    const h = S.pageH;
    await reloadFile(f, await pdf.save());
    measOf(f, S.page).forEach(m => { m.pts = m.pts.map(([x, y]) => [h - y, x]); });
    S.fit = true;
    renderThumbs(); renderPage();
    toast('หมุนหน้า 90° แล้ว');
  } catch (e) { console.error(e); toast('หมุนหน้าไม่สำเร็จ: ' + e.message, 5000); }
  finally { busy(false); }
}

/* =========================================================
   ส่งออก Excel / Word / รายงาน
   ========================================================= */
async function pageRows(page) {
  const tc = await page.getTextContent();
  const vp = page.getViewport({ scale: 1 });
  const items = [];
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const t = pdfjsLib.Util.transform(vp.transform, it.transform);
    const fh = Math.hypot(t[2], t[3]) || 10;
    items.push({ s: it.str, x: t[4], y: t[5], w: it.width, h: fh });
  }
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  for (const it of items) {
    const row = rows.find(r => Math.abs(r.y - it.y) < Math.max(2.5, it.h * 0.45));
    if (row) row.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  rows.sort((a, b) => a.y - b.y);
  return rows.map(r => {
    r.items.sort((a, b) => a.x - b.x);
    const cells = [];
    let cur = null;
    for (const it of r.items) {
      if (cur && it.x - (cur.x2) < Math.max(4, it.h * 0.8)) {
        cur.text += (it.x - cur.x2 > it.h * 0.15 ? ' ' : '') + it.s; cur.x2 = it.x + it.w;
      } else { cur = { text: it.s, x: it.x, x2: it.x + it.w }; cells.push(cur); }
    }
    return cells.map(c => c.text.trim());
  });
}
const toCell = s => (/^-?[\d,]+(\.\d+)?$/.test(s) && /\d/.test(s) ? Number(s.replace(/,/g, '')) : s);

async function exportExcel() {
  const f = active(); if (!f) return toast('กรุณาเปิดไฟล์ PDF ก่อน');
  busy(true, 'กำลังอ่านข้อความใน PDF...');
  try {
    const wb = XLSX.utils.book_new();
    let total = 0;
    for (let p = 1; p <= f.numPages; p++) {
      $('#busyMsg').textContent = `กำลังอ่านหน้า ${p}/${f.numPages}...`;
      const rows = (await pageRows(await f.doc.getPage(p))).map(r => r.map(toCell));
      total += rows.length;
      const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['(หน้านี้ไม่มีข้อความที่อ่านได้)']]);
      const maxCols = Math.max(1, ...rows.map(r => r.length));
      ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, ws, `หน้า ${p}`);
    }
    const info = XLSX.utils.aoa_to_sheet([
      ['SOONTORN-PDF-2027 — AXIS INNOVATION CO.,LTD.'], [],
      ['ไฟล์ต้นฉบับ', f.name], ['จำนวนหน้า', f.numPages], ['จำนวนบรรทัดข้อความ', total], ['วันที่ส่งออก', new Date().toLocaleString('th-TH')],
    ]);
    info['!cols'] = [{ wch: 22 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, info, 'ข้อมูลไฟล์');
    wb.SheetNames.unshift(wb.SheetNames.pop());
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    busy(false);
    if (!total) toast('PDF นี้ไม่มีข้อความ (อาจเป็นภาพสแกนหรือเส้น CAD) — ไฟล์ Excel จะว่าง', 5000);
    await saveBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), baseName(f.name) + '.xlsx', T_XLSX);
  } catch (e) { console.error(e); toast('ส่งออก Excel ไม่สำเร็จ: ' + e.message, 5000); }
  finally { busy(false); }
}

function logoBytes() {
  const b64 = (window.AXIS_LOGO_JPG || '').split(',')[1] || '';
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
async function exportWord() {
  const f = active(); if (!f) return toast('กรุณาเปิดไฟล์ PDF ก่อน');
  const { Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, HeadingLevel, AlignmentType, PageNumber } = docx;
  busy(true, 'กำลังอ่านข้อความใน PDF...');
  try {
    const children = [];
    let total = 0;
    for (let p = 1; p <= f.numPages; p++) {
      $('#busyMsg').textContent = `กำลังอ่านหน้า ${p}/${f.numPages}...`;
      const rows = await pageRows(await f.doc.getPage(p));
      total += rows.length;
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: p > 1, children: [new TextRun(`หน้า ${p}`)] }));
      if (!rows.length) children.push(new Paragraph({ children: [new TextRun({ text: '(หน้านี้ไม่มีข้อความที่อ่านได้)', italics: true, color: '888888' })] }));
      rows.forEach(r => children.push(new Paragraph({ children: [new TextRun(r.join('\t'))] })));
    }
    const header = new Header({ children: [new Paragraph({ children: [
      new ImageRun({ data: logoBytes(), transformation: { width: 36, height: 36 } }),
      new TextRun({ text: '   AXIS INNOVATION CO.,LTD.  ·  ' + f.name, bold: true, color: '0B1A5C' }),
    ] })] });
    const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'SOONTORN-PDF-2027  ·  หน้า ', color: '777777' }), new TextRun({ children: [PageNumber.CURRENT], color: '777777' }),
    ] })] });
    const doc = new Document({
      creator: 'SOONTORN-PDF-2027', title: f.name,
      styles: { default: { document: { run: { font: 'Leelawadee UI', size: 22 } } } },
      sections: [{ headers: { default: header }, footers: { default: footer }, children }],
    });
    const blob = await Packer.toBlob(doc);
    busy(false);
    if (!total) toast('PDF นี้ไม่มีข้อความ (อาจเป็นภาพสแกนหรือเส้น CAD) — ไฟล์ Word จะว่าง', 5000);
    await saveBlob(blob, baseName(f.name) + '.docx', T_DOCX);
  } catch (e) { console.error(e); toast('ส่งออก Word ไม่สำเร็จ: ' + e.message, 5000); }
  finally { busy(false); }
}

async function exportReport() {
  const list = S.meas;
  if (!list.length) return toast('ยังไม่มีรายการวัด — ใช้เครื่องมือ ความยาว / พื้นที่ / นับจำนวน ก่อน', 4000);
  const ordered = [...list].sort((a, b) => S.files.indexOf(fileById(a.fileId)) - S.files.indexOf(fileById(b.fileId)) || a.page - b.page);
  // ---- รายละเอียด ----
  const det = [['ลำดับ', 'ไฟล์', 'หน้า', 'ประเภท', 'ชื่อรายการ', 'ปริมาณ', 'หน่วย', 'เส้นรอบรูป (ม.)', 'สเกล']];
  ordered.forEach((m, i) => {
    const f = fileById(m.fileId), r = measValue(m);
    det.push([i + 1, f.name, m.page, TYPE_TH[m.type], m.name, m.type === 'count' ? r.v : +r.v.toFixed(3), r.unit,
      m.type === 'area' ? +r.perim.toFixed(3) : '', f.mPerPt ? (f.scaleLabel || '1:' + Math.round(f.mPerPt / PT_M)) : '1:100 (ค่าเริ่มต้น)']);
  });
  const wsD = XLSX.utils.aoa_to_sheet(det);
  wsD['!cols'] = [{ wch: 7 }, { wch: 34 }, { wch: 6 }, { wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 8 }, { wch: 15 }, { wch: 22 }];
  wsD['!autofilter'] = { ref: `A1:I${det.length}` };
  const last = det.length;
  const D = c => `'รายละเอียด'!$${c}$2:$${c}$${last}`;
  // ---- สรุป ----
  const types = [['ความยาว', 'ม.'], ['ระยะต่อเนื่อง', 'ม.'], ['พื้นที่', 'ตร.ม.'], ['นับจำนวน', 'จุด']];
  const sum = [
    ['รายงานถอดปริมาณงาน — SOONTORN-PDF-2027'],
    ['บริษัท', 'AXIS INNOVATION CO.,LTD.'],
    ['วันที่ออกรายงาน', new Date().toLocaleString('th-TH')],
    ['ไฟล์', [...new Set(ordered.map(m => fileById(m.fileId).name))].join(', ')],
    [],
    ['ประเภท', 'จำนวนรายการ', 'ปริมาณรวม', 'หน่วย'],
  ];
  const sumStart = sum.length + 1;
  types.forEach(([t, u]) => {
    const items = ordered.filter(m => TYPE_TH[m.type] === t);
    sum.push([t, { t: 'n', f: `COUNTIF(${D('D')},"${t}")`, v: items.length }, { t: 'n', f: `SUMIF(${D('D')},"${t}",${D('F')})`, v: +items.reduce((s, m) => s + measValue(m).v, 0).toFixed(3) }, u]);
  });
  sum.push([], ['สรุปตามชื่อรายการ'], ['ชื่อรายการ', 'ประเภท', 'ปริมาณรวม', 'หน่วย']);
  const groups = {};
  ordered.forEach(m => { const k = m.name + '|' + m.type; (groups[k] = groups[k] || []).push(m); });
  Object.values(groups).forEach(g => {
    const m = g[0], t = TYPE_TH[m.type];
    sum.push([m.name, t, { t: 'n', f: `SUMIFS(${D('F')},${D('E')},"${m.name.replace(/"/g, '""')}",${D('D')},"${t}")`, v: +g.reduce((s, x) => s + measValue(x).v, 0).toFixed(3) }, measValue(m).unit]);
  });
  const wsS = XLSX.utils.aoa_to_sheet(sum);
  for (let r = sumStart; r < sumStart + types.length; r++) { const c = wsS['C' + r]; if (c) c.z = '#,##0.00'; }
  wsS['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 10 }];
  wsS['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  // ---- จุดพิกัด ----
  const pts = [['ชื่อรายการ', 'ไฟล์', 'หน้า', 'จุดที่', 'X (pt)', 'Y (pt)']];
  ordered.forEach(m => m.pts.forEach((p, i) => pts.push([m.name, fileById(m.fileId).name, m.page, i + 1, +p[0].toFixed(2), +p[1].toFixed(2)])));
  const wsP = XLSX.utils.aoa_to_sheet(pts);
  wsP['!cols'] = [{ wch: 24 }, { wch: 30 }, { wch: 6 }, { wch: 6 }, { wch: 10 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsS, 'สรุป');
  XLSX.utils.book_append_sheet(wb, wsD, 'รายละเอียด');
  XLSX.utils.book_append_sheet(wb, wsP, 'พิกัดจุด');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await saveBlob(new Blob([out]), `รายงานถอดปริมาณ_${today()}.xlsx`, T_XLSX);
}

/* ---------- บันทึก/เปิด งานวัด ---------- */
async function saveProject() {
  if (!S.meas.length) return toast('ยังไม่มีรายการวัดให้บันทึก');
  const data = {
    app: 'SOONTORN-PDF-2027', version: 1, saved: new Date().toISOString(),
    files: S.files.map(f => ({ name: f.name, mPerPt: f.mPerPt, scaleLabel: f.scaleLabel })),
    meas: S.meas.map(m => ({ file: fileById(m.fileId).name, page: m.page, type: m.type, pts: m.pts, name: m.name, color: m.color, unit: m.unit })),
  };
  await saveBlob(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), `งานวัด_${today()}.json`, T_JSON);
}
async function openProject(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'SOONTORN-PDF-2027') throw new Error('ไม่ใช่ไฟล์งานวัดของโปรแกรมนี้');
    let added = 0; const missing = new Set();
    data.files.forEach(x => { const f = S.files.find(y => y.name === x.name); if (f && x.mPerPt) { f.mPerPt = x.mPerPt; f.scaleLabel = x.scaleLabel; } });
    data.meas.forEach(x => {
      const f = S.files.find(y => y.name === x.file);
      if (!f) { missing.add(x.file); return; }
      S.meas.push({ id: 'm' + S.seq++, fileId: f.id, page: x.page, type: x.type, pts: x.pts, name: x.name, color: x.color, unit: x.unit });
      added++;
    });
    refreshAll();
    toast(`โหลดรายการวัด ${added} รายการ` + (missing.size ? ` · ไม่พบไฟล์: ${[...missing].join(', ')} (เปิดไฟล์นั้นก่อนแล้วโหลดอีกครั้ง)` : ''), 6000);
  } catch (e) { toast('เปิดงานวัดไม่สำเร็จ: ' + e.message, 5000); }
}

/* =========================================================
   ผูกเหตุการณ์
   ========================================================= */
const ACTIONS = {
  open: () => $('#filePdf').click(),
  print: () => window.openPrint && window.openPrint(),
  save: () => saveActive(false),
  saveAs: () => saveActive(true),
  deleteFile: () => active() ? removeFile(S.activeId) : toast('ยังไม่มีไฟล์'),
  combine, deletePage, rotatePage,
  exportExcel, exportWord, report: exportReport,
  zoomIn: () => setZoom(S.zoom * 1.25),
  togglePanel: () => $('#btnRight').click(),
  zoomOut: () => setZoom(S.zoom / 1.25),
  fitPage: () => { S.fit = true; renderPage(); },
  prev: () => goPage(S.page - 1),
  next: () => goPage(S.page + 1),
  view3d: () => toggle3d(),
  saveProject,
  openProject: () => $('#fileProject').click(),
};
function toggle3d(force) {
  const v = $('#view3d');
  const show = force != null ? force : v.hidden;
  v.hidden = !show;
  $('#btn3d').classList.toggle('active', show);
  $('#pageNav').style.display = show ? 'none' : '';
  if (show) window.V3D && window.V3D.show(); else window.V3D && window.V3D.hide();
}

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  $('#themeSelect').value = t;
  try { localStorage.setItem('spdf-theme', t); } catch (_) {}
  window.V3D && window.V3D.onTheme();
}

function bind() {
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (a && ACTIONS[a.dataset.act]) { ACTIONS[a.dataset.act](); return; }
    const t = e.target.closest('[data-tool]');
    if (t) { setTool(t.dataset.tool); return; }
  });
  $('#filePdf').addEventListener('change', e => { openFiles(e.target.files); e.target.value = ''; });
  $('#fileProject').addEventListener('change', e => { e.target.files[0] && openProject(e.target.files[0]); e.target.value = ''; });

  // แท็บ
  $('#tabs').addEventListener('click', e => {
    const x = e.target.closest('[data-close]');
    if (x) { e.stopPropagation(); removeFile(x.dataset.close); return; }
    const t = e.target.closest('.tab'); if (t && t.dataset.id !== S.activeId) setActive(t.dataset.id);
  });
  // รายการไฟล์
  $('#fileList').addEventListener('click', e => {
    const chk = e.target.closest('[data-chk]');
    if (chk) { fileById(chk.dataset.chk).checked = chk.checked; return; }
    const li = e.target.closest('li[data-id]'); if (li && li.dataset.id !== S.activeId) setActive(li.dataset.id);
  });
  const move = d => {
    const i = S.files.findIndex(f => f.id === S.activeId), j = i + d;
    if (i < 0 || j < 0 || j >= S.files.length) return;
    [S.files[i], S.files[j]] = [S.files[j], S.files[i]];
    renderTabs(); renderFileList();
  };
  $('#fileUp').onclick = () => move(-1);
  $('#fileDown').onclick = () => move(1);
  $('#fileAll').onclick = () => { const all = S.files.every(f => f.checked); S.files.forEach(f => (f.checked = !all)); renderFileList(); };
  $('#thumbs').addEventListener('click', e => { const t = e.target.closest('.thumb'); if (t) goPage(+t.dataset.p); });

  // แผงรายการวัด
  const ml = $('#measList');
  ml.addEventListener('click', e => {
    const d = e.target.closest('[data-del]'); if (d) { deleteMeas(d.dataset.del); return; }
    if (e.target.closest('input')) return;
    const row = e.target.closest('.meas'); if (!row) return;
    const m = S.meas.find(x => x.id === row.dataset.id);
    S.selId = m.id;
    if (m.page !== S.page) { S.page = m.page; renderPage(); } else drawOverlay();
    renderMeasList();
  });
  ml.addEventListener('input', e => {
    const n = e.target.dataset.name, c = e.target.dataset.color;
    if (n) { S.meas.find(x => x.id === n).name = e.target.value; drawOverlay(); }
    if (c) { S.meas.find(x => x.id === c).color = e.target.value; drawOverlay(); }
  });
  $('#onlyPage').onchange = renderMeasList;
  $('#clearMeas').onclick = async () => {
    const f = active(); if (!f || !measOf(f).length) return;
    if (await ask('ลบรายการวัดทั้งหมด', `<p>ลบรายการวัดทั้งหมด ${measOf(f).length} รายการของไฟล์นี้?</p>`, 'ลบทั้งหมด')) {
      S.meas = S.meas.filter(m => m.fileId !== f.id); S.selId = null; drawOverlay(); renderMeasList();
    }
  };
  $('#scaleSelect').onchange = e => {
    const f = active(); if (!f) return;
    const v = +e.target.value;
    if (v) { f.mPerPt = v * PT_M; f.scaleLabel = '1:' + v; } else { f.mPerPt = null; f.scaleLabel = ''; }
    renderScaleUI(); renderMeasList(); drawOverlay();
  };

  // หน้าเอกสาร
  const ov = $('#overlay');
  ov.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  ov.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  document.addEventListener('gesturestart', e => e.preventDefault());   // กันซูมทั้งหน้าใน Safari
  $('#drawBar').addEventListener('click', e => {
    const b = e.target.closest('[data-draw]'); if (!b) return;
    const a = b.dataset.draw;
    if (a === 'finish') finishDraft();
    else if (a === 'cancel') { S.draft = null; S.cursor = null; drawOverlay(); }
    else if (a === 'undo' && S.draft) { S.draft.pts.pop(); if (!S.draft.pts.length) S.draft = null; drawOverlay(); }
    else if (a === 'ortho') { S.ortho = !S.ortho; updateDrawBar(); }
  });
  ov.addEventListener('dblclick', e => { if (S.draft) { e.preventDefault(); finishDraft(); } });
  ov.addEventListener('contextmenu', e => e.preventDefault());
  $('#viewer').addEventListener('wheel', e => {
    if (!e.ctrlKey || !active()) return;
    e.preventDefault();
    setZoom(S.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  }, { passive: false });
  $('#pageInput').addEventListener('change', e => goPage(+e.target.value));

  // ลากวางไฟล์
  const v = $('#viewer');
  ['dragenter', 'dragover'].forEach(t => document.addEventListener(t, e => { e.preventDefault(); v.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(t => document.addEventListener(t, e => { e.preventDefault(); if (t === 'drop' || !e.relatedTarget) v.classList.remove('drag'); }));
  document.addEventListener('drop', e => { if (e.dataTransfer.files.length) openFiles(e.dataTransfer.files); });

  // แป้นพิมพ์
  document.addEventListener('keydown', e => {
    const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || $('#dlg').open;
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); saveActive(e.shiftKey); return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); ACTIONS.open(); return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); ACTIONS.print(); return; }
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) { e.preventDefault(); ACTIONS.zoomIn(); return; }
    if (e.ctrlKey && e.key === '-') { e.preventDefault(); ACTIONS.zoomOut(); return; }
    if (typing) return;
    if (e.key === 'Escape') { if (S.draft) { S.draft = null; drawOverlay(); $('#stHint').textContent = TOOL_HINT[S.tool]; } else if (S.tool !== 'select') setTool('select'); else { S.selId = null; drawOverlay(); renderMeasList(); } }
    else if (e.key === 'Enter') finishDraft();
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.selId) deleteMeas(S.selId);
    else if (e.key === 'PageDown') goPage(S.page + 1);
    else if (e.key === 'PageUp') goPage(S.page - 1);
    else if (!e.ctrlKey && !e.altKey) {
      const map = { v: 'select', l: 'length', p: 'polyline', a: 'area', c: 'count' };
      const t = map[e.key.toLowerCase()]; if (t) setTool(t);
    }
  });

  // แถบด้านบน
  const relayout = () => setTimeout(() => { if (S.fit) renderPage(); window.V3D && window.V3D.resize(); }, 280);
  $('#btnMenu').onclick = () => {
    if (window.innerWidth <= 900) document.body.classList.toggle('menu-open-sm');
    else document.body.classList.toggle('left-closed');
    relayout();
  };
  $('#btnRight').onclick = () => {
    if (window.innerWidth <= 900) document.body.classList.toggle('right-open-sm');
    else document.body.classList.toggle('right-closed');
    relayout();
  };
  $('#btnRibbon').onclick = () => {
    document.body.classList.toggle('ribbon-compact');
    $('#btnRibbon svg').style.transform = document.body.classList.contains('ribbon-compact') ? 'rotate(180deg)' : '';
    setTimeout(() => { if (S.fit) renderPage(); window.V3D && window.V3D.resize(); }, 50);
  };
  $('#btnFull').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast('เบราว์เซอร์ไม่อนุญาตโหมดเต็มจอ'));
  };
  $('#themeSelect').onchange = e => setTheme(e.target.value);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (S.fit) renderPage(); }, 150); });
}

/* ---------- หน้าต้อนรับ ---------- */
function splash() {
  const sp = $('#splash');
  const close = () => { sp.classList.add('hide'); setTimeout(() => sp.remove(), 700); };
  $('#splashStart').onclick = close;
  setTimeout(close, 3200);
}

/* ---------- เปิด PDF ที่ส่งมาจากโปรแกรมเดสก์ท็อป (ดับเบิลคลิกไฟล์ .pdf) ---------- */
window.__openFromShell = async list => {
  for (let i = 0; i < list.length; i++) {
    const bin = atob(list[i].data), u = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
    try { await addPdf(list[i].name, u, i === list.length - 1); } catch (e) { toast('เปิดไฟล์ไม่สำเร็จ: ' + list[i].name, 5000); }
  }
};

/* ---------- เริ่มโปรแกรม ---------- */
(function init() {
  applyIcons();
  let t = 'light';
  try { t = localStorage.getItem('spdf-theme') || 'light'; } catch (_) {}
  setTheme(t);
  bind();
  setTool('select');
  $('#stHint').textContent = 'เปิดไฟล์ PDF เพื่อเริ่มงาน';
  if (IS_TOUCH) document.body.classList.add('touch');
  // กันเมนูค้าง/การเลือกข้อความเมื่อกดปากกาค้างบนแบบ
  if (IS_TOUCH) document.addEventListener('selectstart', e => { if (e.target.closest && e.target.closest('#viewer')) e.preventDefault(); });
  // บนจอสัมผัส ซ่อนแผงข้างไว้ก่อน ให้แบบได้พื้นที่เต็ม (กดปุ่มด้านบนเพื่อเปิด)
  if (IS_TOUCH && window.innerWidth > 900) document.body.classList.add('left-closed', 'right-closed');
  refreshAll();
  splash();
  // ทำงานออฟไลน์ได้ (เมื่อเปิดผ่านเว็บ https เช่นบน iPad)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e));
  }
  $('#appVer').textContent = 'v' + APP_VERSION;
  checkUpdate();
})();

/* ---------- แจ้งเตือนเวอร์ชันใหม่ (เฉพาะโปรแกรมที่ติดตั้งบนคอมพิวเตอร์) ---------- */
async function checkUpdate() {
  const installed = new URLSearchParams(location.search).get('appver');
  if (!installed) return;                      // เวอร์ชันเว็บ/iPad อัปเดตเองอยู่แล้ว
  const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
  try {
    const r = await fetch('https://axisinnovationth.github.io/soontorn-pdf-2027/version.json?t=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    if (!j.version || cmp(j.version, installed) <= 0) return;
    let skip = '';
    try { skip = localStorage.getItem('spdf-skip-ver') || ''; } catch (_) {}
    if (skip === j.version) return;
    $('#updateMsg').textContent = `มีเวอร์ชันใหม่ v${j.version} (ที่ใช้อยู่ v${installed})${j.notes ? ' — ' + j.notes : ''}`;
    $('#updateLink').href = j.download;
    $('#updateBar').hidden = false;
    $('#updateClose').onclick = () => { $('#updateBar').hidden = true; try { localStorage.setItem('spdf-skip-ver', j.version); } catch (_) {} };
  } catch (_) { /* ไม่มีอินเทอร์เน็ต — ข้าม */ }
}
