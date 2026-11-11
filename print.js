/* =========================================================
   SOONTORN-PDF-2027 — ปริ้น / ส่งเป็น PDF (A4 / A3)
   - แบบพร้อมเส้นวัด / แบบเปล่า / รายงานสรุปการวัด
   - หัวกระดาษโลโก้บริษัท + ท้ายกระดาษบอกอัตราย่อ
   - คอมพิวเตอร์: หน้าต่างปริ้นของ Windows
   - iPad: หน้าต่างแชร์ → พิมพ์ (AirPrint) หรือ Notability
   ========================================================= */
'use strict';

const PAPER = { A4: [595.28, 841.89], A3: [841.89, 1190.55] };     // หน่วย point
const PAPER_MM = { A4: [210, 297], A3: [297, 420] };
const FONT_TH = '"Leelawadee UI", Thonburi, "Sukhumvit Set", Tahoma, sans-serif';
const NAVY = '#0b1a5c', GREEN = '#7ab51d';

let _logoImg = null;
function logoImage() {
  if (!_logoImg) _logoImg = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = window.AXIS_LOGO_JPG; });
  return _logoImg;
}
const canvasPng = async c => new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer());

/* ---------- แถบหัว/ท้ายกระดาษ (วาดด้วย canvas เพื่อให้ภาษาไทยแสดงถูกต้อง) ---------- */
async function stripPng(wPt, hPt, o) {
  const k = 4, c = document.createElement('canvas');
  c.width = Math.round(wPt * k); c.height = Math.round(hPt * k);
  const g = c.getContext('2d'); g.scale(k, k);
  g.fillStyle = '#fff'; g.fillRect(0, 0, wPt, hPt);
  g.textBaseline = 'middle';
  let x = 0;
  if (o.logo) { const L = await logoImage(); const s = hPt - 2; g.drawImage(L, 0, 1, s, s); x = s + 6; }
  if (o.title) {
    g.textAlign = 'left'; g.fillStyle = NAVY; g.font = `700 ${o.titleSize || 10}px ${FONT_TH}`;
    g.fillText(o.title, x, o.sub ? hPt / 2 - 5 : hPt / 2);
    if (o.sub) { g.fillStyle = '#556'; g.font = `400 7px ${FONT_TH}`; g.fillText(o.sub, x, hPt / 2 + 7); }
  }
  if (o.left) { g.textAlign = 'left'; g.fillStyle = '#444'; g.font = `400 7px ${FONT_TH}`; g.fillText(o.left, x, hPt / 2); }
  const right = [].concat(o.right || []);
  g.textAlign = 'right';
  right.forEach((t, i) => {
    g.fillStyle = i === 0 && o.logo ? NAVY : '#444';
    g.font = `${i === 0 && o.logo ? 600 : 400} ${o.rightSize || 7.5}px ${FONT_TH}`;
    g.fillText(t, wPt, hPt / 2 + (i - (right.length - 1) / 2) * 10);
  });
  return canvasPng(c);
}

/* ---------- หน้าแบบ (PDF ต้นฉบับ วางลงกระดาษ A4/A3 แบบเวกเตอร์ คมชัด) ---------- */
async function addDrawingPages(out, o) {
  const f = active();
  const src = await PDFDocument.load(o.what === 'marked' && measOf(f).length ? await bakePdf(f) : f.bytes, { ignoreEncryption: true });
  const info = o.pages.map(n => {
    const p = src.getPage(n - 1), cb = p.getCropBox();
    const rot = ((p.getRotation().angle % 360) + 360) % 360;
    return { n, p, cb, rot, sw: rot % 180 ? cb.height : cb.width, sh: rot % 180 ? cb.width : cb.height };
  });
  let land = o.orient === 'landscape';
  if (o.orient === 'auto') land = info.filter(i => i.sw > i.sh).length >= info.length / 2;
  const [a, b] = PAPER[o.paper], PW = land ? b : a, PH = land ? a : b;
  const m = 20, H = o.header ? 32 : 0, F = 14, gap = 6;
  const cw = PW - 2 * m, ch = PH - 2 * m - H - F - (H ? gap : 0) - gap;
  const ratio = f.mPerPt ? f.mPerPt / PT_M : null;
  const stamp = new Date().toLocaleString('th-TH');
  const kind = o.what === 'marked' ? 'แบบพร้อมผลการวัด' : 'แบบต้นฉบับ';
  for (const it of info) {
    const emb = await out.embedPage(it.p, { left: it.cb.x, bottom: it.cb.y, right: it.cb.x + it.cb.width, top: it.cb.y + it.cb.height });
    const s = Math.min(cw / it.sw, ch / it.sh);
    const dw = it.sw * s, dh = it.sh * s;
    const dx = m + (cw - dw) / 2, dy = m + F + gap + (ch - dh) / 2;
    const org = { 0: [dx, dy], 90: [dx, dy + dh], 180: [dx + dw, dy + dh], 270: [dx + dw, dy] }[it.rot] || [dx, dy];
    const page = out.addPage([PW, PH]);
    page.drawPage(emb, { x: org[0], y: org[1], xScale: s, yScale: s, rotate: degrees(-it.rot) });
    if (H) {
      const hp = await out.embedPng(await stripPng(cw, H, {
        logo: true, title: 'AXIS INNOVATION CO.,LTD.', sub: 'SOONTORN-PDF-2027 · ' + kind,
        right: [f.name, `หน้า ${it.n} / ${f.numPages}`],
      }));
      page.drawImage(hp, { x: m, y: PH - m - H, width: cw, height: H });
      page.drawLine({ start: { x: m, y: PH - m - H - 3 }, end: { x: PW - m, y: PH - m - H - 3 }, thickness: 1, color: PDFLib.rgb(0.48, 0.71, 0.11) });
    }
    const pct = Math.round(s * 100);
    const scaleTxt = Math.abs(s - 1) < 0.005 ? 'ขนาดเท่าต้นฉบับ' :
      `${s < 1 ? 'ย่อ' : 'ขยาย'}เป็น ${pct}% ของต้นฉบับ` + (ratio ? ` · สเกลบนกระดาษ ≈ 1:${Math.round(ratio / s)}` : '') + ' — ห้ามวัดระยะด้วยไม้บรรทัด';
    const fp = await out.embedPng(await stripPng(cw, F, { left: `พิมพ์เมื่อ ${stamp} · ${o.paper}`, right: scaleTxt, rightSize: 7 }));
    page.drawImage(fp, { x: m, y: m, width: cw, height: F });
  }
  return { land };
}

/* ---------- หน้ารายงานสรุปการวัด (วาดเป็นตาราง) ---------- */
async function addReportPages(out, o) {
  if (!S.meas.length) throw new Error('ยังไม่มีรายการวัด — ใช้เครื่องมือ ความยาว / พื้นที่ / นับจำนวน ก่อน');
  const list = [...S.meas].sort((x, y) => S.files.indexOf(fileById(x.fileId)) - S.files.indexOf(fileById(y.fileId)) || x.page - y.page);
  const land = o.orient === 'landscape';
  const [a, b] = PAPER[o.paper], PW = land ? b : a, PH = land ? a : b;
  const k = 2.5, m = 32, logo = await logoImage();
  const pages = [];
  let c, g, y;
  const stamp = new Date().toLocaleString('th-TH');
  const newPage = () => {
    c = document.createElement('canvas'); c.width = Math.round(PW * k); c.height = Math.round(PH * k);
    g = c.getContext('2d'); g.scale(k, k); g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH);
    g.drawImage(logo, m, m - 4, 44, 44);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = NAVY; g.font = `700 15px ${FONT_TH}`; g.fillText('รายงานถอดปริมาณงาน', m + 54, m + 8);
    g.fillStyle = '#556'; g.font = `400 8.5px ${FONT_TH}`; g.fillText('AXIS INNOVATION CO.,LTD. · SOONTORN-PDF-2027', m + 54, m + 26);
    g.textAlign = 'right'; g.fillText('วันที่ ' + stamp, PW - m, m + 8);
    g.strokeStyle = GREEN; g.lineWidth = 1.5; g.beginPath(); g.moveTo(m, m + 46); g.lineTo(PW - m, m + 46); g.stroke();
    y = m + 62; pages.push(c);
  };
  const need = h => { if (y + h > PH - m - 20) newPage(); };
  const heading = t => { need(40); g.textAlign = 'left'; g.fillStyle = NAVY; g.font = `700 11px ${FONT_TH}`; g.fillText(t, m, y); y += 16; };
  const table = (cols, rows) => {
    const W = PW - 2 * m, tot = cols.reduce((s, x) => s + x.w, 0);
    const xs = []; let x = m; cols.forEach(cl => { xs.push(x); x += cl.w / tot * W; });
    const rowH = 15;
    const head = () => {
      g.fillStyle = NAVY; g.fillRect(m, y - rowH / 2, W, rowH);
      g.fillStyle = '#fff'; g.font = `600 8px ${FONT_TH}`;
      cols.forEach((cl, i) => { g.textAlign = cl.r ? 'right' : 'left'; g.fillText(cl.t, cl.r ? xs[i] + cl.w / tot * W - 4 : xs[i] + 4, y); });
      y += rowH;
    };
    need(rowH * 3); head();
    rows.forEach((r, ri) => {
      if (y + rowH > PH - m - 20) { newPage(); head(); }
      if (r.bold) { g.fillStyle = '#e6f2d3'; g.fillRect(m, y - rowH / 2, W, rowH); }
      else if (ri % 2) { g.fillStyle = '#f3f5f9'; g.fillRect(m, y - rowH / 2, W, rowH); }
      g.fillStyle = '#1d2433'; g.font = `${r.bold ? 700 : 400} 8px ${FONT_TH}`;
      r.cells.forEach((v, i) => {
        const cl = cols[i], cwid = cl.w / tot * W - 8;
        let t = String(v);
        while (t.length > 1 && g.measureText(t).width > cwid) t = t.slice(0, -2) + '…';
        g.textAlign = cl.r ? 'right' : 'left';
        g.fillText(t, cl.r ? xs[i] + cl.w / tot * W - 4 : xs[i] + 4, y);
      });
      y += rowH;
    });
    y += 14;
  };
  newPage();
  const files = [...new Set(list.map(x => fileById(x.fileId).name))];
  g.textAlign = 'left'; g.fillStyle = '#333'; g.font = `400 8.5px ${FONT_TH}`;
  files.forEach(n => { need(12); g.fillText('ไฟล์: ' + n, m, y); y += 12; });
  y += 8;
  // สรุปตามประเภท
  const types = [['ความยาว', 'ม.'], ['ระยะต่อเนื่อง', 'ม.'], ['พื้นที่', 'ตร.ม.'], ['นับจำนวน', 'จุด']];
  heading('สรุปตามประเภท');
  table([{ t: 'ประเภท', w: 3 }, { t: 'จำนวนรายการ', w: 2, r: 1 }, { t: 'ปริมาณรวม', w: 2, r: 1 }, { t: 'หน่วย', w: 1.2 }],
    types.map(([t, u]) => {
      const it = list.filter(x => TYPE_TH[x.type] === t);
      const sum = it.reduce((s, x) => s + measValue(x).v, 0);
      return { cells: [t, it.length, t === 'นับจำนวน' ? sum : fmt(sum), u] };
    }).filter(r => r.cells[1] > 0));
  // สรุปตามชื่อรายการ
  const groups = {};
  list.forEach(x => { const key = x.name + '|' + x.type; (groups[key] = groups[key] || []).push(x); });
  heading('สรุปตามชื่อรายการ');
  table([{ t: 'ชื่อรายการ', w: 4 }, { t: 'ประเภท', w: 2 }, { t: 'ปริมาณรวม', w: 2, r: 1 }, { t: 'หน่วย', w: 1.2 }],
    Object.values(groups).map(gp => {
      const x = gp[0], sum = gp.reduce((s, q) => s + measValue(q).v, 0);
      return { cells: [x.name, TYPE_TH[x.type], x.type === 'count' ? sum : fmt(sum), measValue(x).unit] };
    }));
  // รายละเอียด
  heading('รายละเอียดการวัด');
  table([{ t: '#', w: 0.6 }, { t: 'ไฟล์', w: 3.4 }, { t: 'หน้า', w: 0.8, r: 1 }, { t: 'ประเภท', w: 1.8 }, { t: 'ชื่อรายการ', w: 3 }, { t: 'ปริมาณ', w: 1.8, r: 1 }, { t: 'หน่วย', w: 1 }],
    list.map((x, i) => { const r = measValue(x); return { cells: [i + 1, fileById(x.fileId).name, x.page, TYPE_TH[x.type], x.name, x.type === 'count' ? r.v : fmt(r.v), r.unit] }; }));
  // เลขหน้า + ฝังลง PDF
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i], gg = pg.getContext('2d');
    gg.textAlign = 'center'; gg.fillStyle = '#888'; gg.font = `400 7.5px ${FONT_TH}`;
    gg.fillText(`หน้า ${i + 1} / ${pages.length}`, PW / 2, PH - m + 6);
    const img = await out.embedPng(await canvasPng(pg));
    out.addPage([PW, PH]).drawImage(img, { x: 0, y: 0, width: PW, height: PH });
  }
  return { land };
}

function parsePages(txt, max) {
  const set = new Set();
  String(txt).split(/[,\s]+/).forEach(part => {
    const r = part.match(/^(\d+)(?:-(\d+))?$/); if (!r) return;
    let a = +r[1], b = r[2] ? +r[2] : a; if (a > b) [a, b] = [b, a];
    for (let i = Math.max(1, a); i <= Math.min(max, b); i++) set.add(i);
  });
  return [...set].sort((x, y) => x - y);
}

async function buildPrintPdf(o) {
  const out = await PDFDocument.create();
  out.setTitle(o.title); out.setAuthor('AXIS INNOVATION CO.,LTD.'); out.setCreator('SOONTORN-PDF-2027');
  const r = o.what === 'report' ? await addReportPages(out, o) : await addDrawingPages(out, o);
  return { bytes: await out.save(), land: r.land };
}

/* ---------- ส่งไปเครื่องปริ้น (คอมพิวเตอร์) ---------- */
async function printBytes(bytes, paper, land) {
  const area = $('#printArea'); area.innerHTML = '';
  const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  const dpi = doc.numPages > 20 ? 120 : paper === 'A3' ? 160 : 200;
  // ส่งเป็นกระดาษแนวตั้งเสมอ: หน้าแนวนอนจะหมุน 90° ให้เอง
  // (บางเครื่องปริ้นไม่สนใจการตั้งแนวกระดาษจากโปรแกรม จึงหมุนเองเพื่อให้ออกถูกทุกเครื่อง)
  const [W, H] = PAPER_MM[paper];
  for (let p = 1; p <= doc.numPages; p++) {
    $('#busyMsg').textContent = `กำลังเตรียมหน้าพิมพ์ ${p}/${doc.numPages}...`;
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: dpi / 72, rotation: land ? 90 : 0 });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    const url = URL.createObjectURL(await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)));
    const d = document.createElement('div'); d.className = 'pp'; d.style.width = W + 'mm'; d.style.height = H + 'mm';
    const img = new Image(); img.src = url; d.appendChild(img); area.appendChild(d);
    await img.decode().catch(() => {});
  }
  doc.destroy();
  let st = $('#printPageStyle');
  if (!st) { st = document.createElement('style'); st.id = 'printPageStyle'; document.head.appendChild(st); }
  st.textContent = `@page { size: ${paper} portrait; margin: 0; }`;
  busy(false);
  const cleanup = () => { $$('#printArea img').forEach(i => URL.revokeObjectURL(i.src)); area.innerHTML = ''; };
  window.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(() => window.print(), 50);
}

/* ---------- iPad: หน้าต่างแชร์ (ต้องเรียกจากการแตะปุ่มโดยตรง) ---------- */
function shareReady(blob, name, purpose) {
  const file = new File([blob], name, { type: 'application/pdf' });
  const canShare = navigator.canShare && navigator.canShare({ files: [file] });
  const dlg = $('#dlg');
  $('#dlgTitle').textContent = 'ไฟล์พร้อมแล้ว';
  $('#dlgBody').innerHTML = `<p><b>${esc(name)}</b></p>
    <p>กดปุ่ม <b>แชร์</b> ด้านล่าง แล้วเลือก:</p>
    <ul class="small">
      <li><b>พิมพ์ (Print)</b> — ส่งไปเครื่องปริ้น AirPrint</li>
      <li><b>Notability</b> — ถ้าไม่เห็น ให้เลื่อนแถวไอคอนแอปไปทางขวา หรือกด "เพิ่มเติม"</li>
      <li><b>บันทึกไปยังแอป Files</b> / LINE / อีเมล</li>
    </ul>`;
  const ok = $('#dlgOk'); ok.textContent = purpose === 'print' ? 'แชร์ / พิมพ์' : 'แชร์ไป Notability';
  $('#dlgAlt').hidden = true;
  dlg.returnValue = ''; dlg.showModal();
  ok.onclick = ev => {
    ev.preventDefault(); ok.onclick = null; dlg.close('ok');
    if (canShare) navigator.share({ files: [file], title: name }).catch(e => { if (e.name !== 'AbortError') saveBlob(blob, name, T_PDF); });
    else saveBlob(blob, name, T_PDF);
  };
  dlg.onclose = () => { ok.onclick = null; };
}

/* ---------- หน้าต่างตั้งค่าการปริ้น ---------- */
async function openPrint() {
  const f = active();
  if (!f && !S.meas.length) return toast('กรุณาเปิดไฟล์ PDF ก่อน');
  const hasMeas = f && measOf(f).length > 0;
  const defWhat = !f ? 'report' : hasMeas ? 'marked' : 'plain';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('spdf-print') || '{}'); } catch (_) {}
  const dlg = $('#dlg');
  $('#dlgTitle').textContent = 'ปริ้น / ส่งเป็น PDF';
  $('#dlgBody').innerHTML = `
    <label>ต้องการพิมพ์</label>
    <select id="pWhat">
      <option value="marked" ${f ? '' : 'disabled'}>แบบพร้อมเส้นวัดและผลการวัด</option>
      <option value="plain" ${f ? '' : 'disabled'}>แบบเปล่า (ต้นฉบับ)</option>
      <option value="report" ${S.meas.length ? '' : 'disabled'}>รายงานสรุปการวัด (ตาราง)</option>
    </select>
    <div id="pPagesBox">
      <label>หน้า ${f ? `(ไฟล์ ${esc(f.name)} มี ${f.numPages} หน้า)` : ''}</label>
      <select id="pRange">
        <option value="all">ทุกหน้า</option>
        <option value="cur">หน้าปัจจุบัน (หน้า ${S.page})</option>
        <option value="custom">กำหนดเอง</option>
      </select>
      <input id="pCustom" placeholder="เช่น 1-3, 5, 8" style="margin-top:6px" hidden>
    </div>
    <div style="display:flex;gap:10px">
      <div style="flex:1"><label>ขนาดกระดาษ</label>
        <select id="pPaper"><option value="A4">A4</option><option value="A3">A3</option></select></div>
      <div style="flex:1"><label>แนวกระดาษ</label>
        <select id="pOrient"><option value="auto">อัตโนมัติ</option><option value="portrait">แนวตั้ง</option><option value="landscape">แนวนอน</option></select></div>
    </div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="pHeader" style="width:auto" checked> ใส่หัวกระดาษโลโก้บริษัท</label>
    <p class="muted small" style="margin:10px 0 0">แบบจะถูกย่อ/ขยายให้พอดีกระดาษ และพิมพ์อัตราย่อไว้ท้ายกระดาษ<br>
    ${IS_IOS ? 'บน iPad ทั้ง 2 ปุ่มจะเปิดหน้าต่างแชร์ ให้เลือก "พิมพ์" หรือ "Notability"' : '"ส่งเป็น PDF" จะบันทึกไฟล์ PDF ขนาด A4/A3 ไว้ส่งต่อหรือเปิดใน Notability'}</p>`;
  const sel = (id, v) => { const e = $(id); if (v && [...e.options].some(o => o.value === v && !o.disabled)) e.value = v; };
  sel('#pWhat', defWhat); sel('#pPaper', saved.paper || 'A4'); sel('#pOrient', saved.orient || 'auto');
  if (saved.header === false) $('#pHeader').checked = false;
  const sync = () => { $('#pPagesBox').hidden = $('#pWhat').value === 'report'; $('#pCustom').hidden = $('#pRange').value !== 'custom'; };
  $('#pWhat').onchange = sync; $('#pRange').onchange = sync; sync();
  $('#dlgOk').textContent = '🖨 ปริ้น';
  const alt = $('#dlgAlt'); alt.hidden = false; alt.textContent = 'ส่งเป็น PDF (Notability)';
  dlg.returnValue = ''; dlg.showModal();
  const mode = await new Promise(res => { dlg.onclose = () => res(dlg.returnValue); });
  alt.hidden = true;
  if (mode !== 'ok' && mode !== 'alt') return;

  const o = {
    what: $('#pWhat').value, paper: $('#pPaper').value, orient: $('#pOrient').value, header: $('#pHeader').checked,
  };
  try { localStorage.setItem('spdf-print', JSON.stringify({ paper: o.paper, orient: o.orient, header: o.header })); } catch (_) {}
  if (o.what !== 'report') {
    const r = $('#pRange').value;
    o.pages = r === 'all' ? Array.from({ length: f.numPages }, (_, i) => i + 1) : r === 'cur' ? [S.page] : parsePages($('#pCustom').value, f.numPages);
    if (!o.pages.length) return toast('ระบุหน้าที่ต้องการพิมพ์ไม่ถูกต้อง เช่น 1-3, 5', 4000);
  }
  const base = o.what === 'report' ? `รายงานถอดปริมาณ_${today()}` : baseName(f.name) + (o.what === 'marked' ? '_วัดปริมาณ' : '');
  const name = `${base}_${o.paper}.pdf`;
  o.title = base;
  busy(true, 'กำลังจัดหน้าพิมพ์...');
  try {
    const { bytes, land } = await buildPrintPdf(o);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    if (IS_IOS) { busy(false); shareReady(blob, name, mode === 'ok' ? 'print' : 'pdf'); return; }
    if (mode === 'alt') { busy(false); await saveBlob(blob, name, T_PDF); return; }
    await printBytes(bytes, o.paper, land);
  } catch (e) {
    console.error(e); toast('เตรียมหน้าพิมพ์ไม่สำเร็จ: ' + e.message, 5000);
  } finally { busy(false); }
}
window.openPrint = openPrint;
