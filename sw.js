/* SOONTORN-PDF-2027 — เก็บไฟล์โปรแกรมไว้ในเครื่อง เพื่อใช้งานแบบออฟไลน์ */
const VERSION = 'spdf-2027-v8';
const FILES = [
  './',
  'index.html', 'app.js', 'viewer3d.js', 'print.js', 'styles.css', 'manifest.webmanifest',
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "lib/GLTFLoader.js",
  "lib/OBJLoader.js",
  "lib/OrbitControls.js",
  "lib/STLLoader.js",
  "lib/docx.iife.js",
  "lib/logo-data.js",
  "lib/pdf-lib.min.js",
  "lib/pdf.min.js",
  "lib/pdf.worker.min.js",
  "lib/three.min.js",
  "lib/xlsx.full.min.js",
  "logo/axis-logo-601221-006.jpg",
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// ใช้ไฟล์ในเครื่องก่อน แล้วอัปเดตจากเว็บเบื้องหลัง (ได้เวอร์ชันใหม่เมื่อเปิดครั้งถัดไป)
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('version.json') || u.pathname.includes('/download/')) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
