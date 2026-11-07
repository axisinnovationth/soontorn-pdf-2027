/* ===== หน้าต่างโมเดล 3D — หมุน / ย่อขยาย / มุมมอง ===== */
(function () {
  'use strict';
  let renderer, scene, camera, controls, grid, model = null, inited = false, visible = false, wire = false;
  const box = () => document.getElementById('v3dCanvas');

  function mat(color) { return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 }); }

  // บ้านตัวอย่าง ให้ทดลองหมุนได้ทันทีโดยไม่ต้องมีไฟล์
  function sampleHouse() {
    const g = new THREE.Group();
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
    add(new THREE.BoxGeometry(12.4, 0.3, 9.4), mat(0x9e9e9e), 0, 0.15, 0);                // พื้น
    const wall = mat(0xf2efe6);
    add(new THREE.BoxGeometry(12, 3, 0.2), wall, 0, 1.8, -4.4);
    add(new THREE.BoxGeometry(12, 3, 0.2), wall, 0, 1.8, 4.4);
    add(new THREE.BoxGeometry(0.2, 3, 9), wall, -5.9, 1.8, 0);
    add(new THREE.BoxGeometry(0.2, 3, 9), wall, 5.9, 1.8, 0);
    add(new THREE.BoxGeometry(0.15, 3, 4.5), wall, 1, 1.8, -2.1);                           // ผนังภายใน
    add(new THREE.BoxGeometry(1, 2.2, 0.25), mat(0x7b4a2a), -2, 1.4, 4.45);                // ประตู
    const glass = new THREE.MeshStandardMaterial({ color: 0x8ec5ff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 });
    [[-4.3, 4.45], [1.5, 4.45], [3.8, 4.45], [-4.3, -4.45], [3.8, -4.45]].forEach(([x, z]) => add(new THREE.BoxGeometry(1.4, 1.2, 0.25), glass, x, 2, z));
    // หลังคาจั่ว
    const shape = new THREE.Shape(); shape.moveTo(-5.2, 0); shape.lineTo(5.2, 0); shape.lineTo(0, 2.6); shape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: 13.2, bevelEnabled: false });
    const roof = new THREE.Mesh(roofGeo, mat(0x0b1a5c));
    roof.rotation.y = Math.PI / 2; roof.position.set(-6.6, 3.3, 0); g.add(roof);
    // เสาโรงรถ
    [[-5.8, 6.8], [-1.2, 6.8]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 16), mat(0x7ab51d), x, 1.4, z));
    add(new THREE.BoxGeometry(5.4, 0.12, 2.8), mat(0x7ab51d), -3.5, 2.85, 5.9);
    add(new THREE.BoxGeometry(18, 0.05, 16), mat(0x6f9a4a), 0, 0.0, 1);                   // สนาม
    return g;
  }

  function init() {
    if (inited) return; inited = true;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    box().appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.05, 100000);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotateSpeed = 2.2;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(15, 25, 18); scene.add(sun);
    setModel(sampleHouse(), 'โมเดลตัวอย่าง (บ้าน 1 ชั้น)');
    new ResizeObserver(resize).observe(box());
    onTheme(); loop();
  }

  function setModel(obj, name) {
    if (model) scene.remove(model);
    model = obj; scene.add(model);
    if (wire) setWire(true);
    const b = new THREE.Box3().setFromObject(model);
    const size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const r = Math.max(size.x, size.y, size.z) || 1;
    if (grid) scene.remove(grid);
    grid = new THREE.GridHelper(r * 3, 30, 0x888888, 0x666666);
    grid.position.set(c.x, b.min.y, c.z); grid.material.opacity = 0.35; grid.material.transparent = true;
    scene.add(grid);
    controls.target.copy(c);
    model.userData.radius = r;
    setView('iso');
    document.getElementById('modelName').textContent = name;
  }

  function setView(v) {
    const r = (model && model.userData.radius) || 10, d = r * 1.8, t = controls.target;
    const dir = { iso: [1, 0.8, 1.2], top: [0, 1, 0.0001], front: [0, 0.15, 1], side: [1, 0.15, 0] }[v] || [1, 0.8, 1.2];
    const n = new THREE.Vector3(...dir).normalize().multiplyScalar(d);
    camera.position.copy(t).add(n);
    camera.near = r / 200; camera.far = r * 100; camera.updateProjectionMatrix();
    controls.update();
  }

  function orbit(dTheta, dPhi) {
    const off = camera.position.clone().sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    s.theta += dTheta; s.phi = Math.max(0.05, Math.min(Math.PI - 0.05, s.phi + dPhi));
    off.setFromSpherical(s); camera.position.copy(controls.target).add(off); controls.update();
  }

  function setWire(on) {
    wire = on;
    model && model.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { m.wireframe = on; }); });
    document.querySelector('[data-3d="wire"]').classList.toggle('active', on);
  }

  function loadFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const fail = e => { console.error(e); alert('เปิดโมเดลไม่สำเร็จ: ' + (e.message || e)); };
    const rd = new FileReader();
    rd.onload = () => {
      try {
        if (ext === 'glb' || ext === 'gltf') {
          new THREE.GLTFLoader().parse(rd.result, '', g => setModel(g.scene, file.name), fail);
        } else if (ext === 'obj') {
          const o = new THREE.OBJLoader().parse(new TextDecoder().decode(rd.result));
          o.traverse(m => { if (m.isMesh) m.material = mat(0xd9d4c7); });
          setModel(o, file.name);
        } else if (ext === 'stl') {
          const geo = new THREE.STLLoader().parse(rd.result); geo.computeVertexNormals();
          const m = new THREE.Mesh(geo, mat(0xb0bec5)); m.rotation.x = -Math.PI / 2;
          const g = new THREE.Group(); g.add(m); setModel(g, file.name);
        } else fail(new Error('รองรับเฉพาะ .glb .gltf .obj .stl'));
      } catch (e) { fail(e); }
    };
    rd.readAsArrayBuffer(file);
  }

  function resize() {
    if (!inited) return;
    const b = box(); const w = b.clientWidth, h = b.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    controls.update(); renderer.render(scene, camera);
  }
  function onTheme() {
    if (!inited) return;
    const c = getComputedStyle(document.documentElement).getPropertyValue('--viewer').trim() || '#5b6070';
    scene.background = new THREE.Color(c);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-3d]'); if (!b) return;
    const a = b.dataset['3d'];
    if (a === 'open') document.getElementById('fileModel').click();
    else if (a === 'left') orbit(-Math.PI / 4, 0);
    else if (a === 'right') orbit(Math.PI / 4, 0);
    else if (a === 'up') orbit(0, -Math.PI / 12);
    else if (a === 'down') orbit(0, Math.PI / 12);
    else if (a === 'auto') { controls.autoRotate = !controls.autoRotate; b.classList.toggle('active', controls.autoRotate); }
    else if (a === 'wire') setWire(!wire);
    else if (a === 'reset') { controls.autoRotate = false; document.getElementById('btnAuto').classList.remove('active'); setView('iso'); }
    else if (a === 'close') window.toggle3d && toggle3d(false);
    else setView(a);
  });
  document.getElementById('fileModel').addEventListener('change', e => { e.target.files[0] && loadFile(e.target.files[0]); e.target.value = ''; });

  window.V3D = {
    show() { init(); visible = true; requestAnimationFrame(resize); },
    hide() { visible = false; },
    resize, onTheme,
  };
})();
