// app.js
import { createFutsalCourtVisual } from "./FutsalCourtVisual.js";

let scene, camera, renderer;
let root;

let players = [];
let arrows = [];
let ball = null;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let selectedObject = null;
let dragging = false;

let toolMode = "move"; // "move" | "arrow"
let arrowDraft = null;

// Cámara tipo pizarra (zoom rueda)
const CAMERA_LOOK = new THREE.Vector3(0, 0, 0);
let cameraRadius = 40;
const cameraDir = new THREE.Vector3(0, 0.73, 0.68).normalize();

// Rotación del mapa
let mapRotate = { active: false, lastX: 0, lastY: 0 };

// Animación por flechas
let moveJobs = [];

// Equipos/nombres
let nextTeam = 0;
let counters = { A: 1, B: 1, GK: 1 };

// Screen recorder
let screenStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isScreenRecording = false;
let btnScreenRec = null;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b6623);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  applyCamera();

  const canvas = document.getElementById("scene");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(10, 25, 10);
  scene.add(dir);

  root = new THREE.Group();
  scene.add(root);

  root.add(createFutsalCourtVisual(THREE, { length: 40, width: 20 }));
  createBall();

  btnScreenRec = document.getElementById("btnScreenRec");

  window.addEventListener("resize", onResize);
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("wheel", onWheel, { passive: false });

  window.addEventListener("mouseleave", forceStopAll);
  window.addEventListener("blur", forceStopAll);

  window.addEventListener("dblclick", onDoubleClickRename);

  // Botones
  window.addPlayer = addPlayer;
  window.addGoalkeeper = addGoalkeeper;
  window.addArrow = () => (toolMode = "arrow");
  window.deleteSelected = deleteSelected;
  window.savePlay = savePlay;
  window.loadPlay = loadPlay;
  window.animatePlay = animatePlay;

  // Grabar pantalla
  window.toggleScreenRecord = toggleScreenRecord;
}

function applyCamera() {
  const pos = cameraDir.clone().multiplyScalar(cameraRadius);
  camera.position.copy(pos);
  camera.lookAt(CAMERA_LOOK);
}

function onWheel(e) {
  e.preventDefault();
  cameraRadius += e.deltaY * 0.03;
  cameraRadius = Math.max(18, Math.min(90, cameraRadius));
  applyCamera();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function forceStopAll() {
  mapRotate.active = false;
  dragging = false;
  arrowDraft = null;
  toolMode = "move";
}

/* ===================== PELOTA ===================== */
function createBall() {
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  ball.position.set(0, 0.35, 0);
  ball.name = "ball";
  root.add(ball);
}

/* ===================== LABEL ===================== */
function makeLabelSprite(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = "bold 48px Arial";
  ctx.font = font;
  const pad = 18;
  const w = Math.ceil(ctx.measureText(text).width + pad * 2);
  const h = 72;

  canvas.width = w;
  canvas.height = h;

  ctx.font = font;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, 0, 0, w, h, 16);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(2.4, 1.0, 1.0);
  s.renderOrder = 999;
  return s;
}

function setLabel(player, newName) {
  player.userData.label = newName;
  const old = player.getObjectByName("labelSprite");
  if (old) player.remove(old);

  const label = makeLabelSprite(newName);
  label.name = "labelSprite";
  label.position.set(0, 2.15, 0);
  player.add(label);
}

/* ===================== JUGADORES (más realistas) ===================== */
function createHumanoid(THREE, kit, name, isGK = false) {
  const g = new THREE.Group();
  g.userData.kind = isGK ? "goalkeeper" : "player";
  g.userData.team = kit.team;

  // sombra
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 28),
    new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.02;
  g.add(shadow);

  // piernas (2)
  const legMat = new THREE.MeshStandardMaterial({ color: kit.shorts, roughness: 0.8 });
  const legGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.8, 14);

  const legL = new THREE.Mesh(legGeom, legMat);
  legL.position.set(-0.18, -0.7, 0);
  const legR = new THREE.Mesh(legGeom, legMat);
  legR.position.set(0.18, -0.7, 0);
  g.add(legL, legR);

  // botines
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const bootGeom = new THREE.BoxGeometry(0.18, 0.08, 0.32);
  const bootL = new THREE.Mesh(bootGeom, bootMat);
  bootL.position.set(-0.18, -1.12, 0.08);
  const bootR = new THREE.Mesh(bootGeom, bootMat);
  bootR.position.set(0.18, -1.12, 0.08);
  g.add(bootL, bootR);

  // torso (camiseta)
  const torsoMat = new THREE.MeshStandardMaterial({ color: kit.shirt, roughness: 0.6 });
  const torsoGeom = new THREE.CapsuleGeometry(0.42, 0.95, 6, 16);
  const torso = new THREE.Mesh(torsoGeom, torsoMat);
  torso.position.y = 0.15;
  g.add(torso);

  // hombros
  const shoulderGeom = new THREE.SphereGeometry(0.18, 16, 16);
  const shL = new THREE.Mesh(shoulderGeom, torsoMat);
  shL.position.set(-0.52, 0.55, 0);
  const shR = new THREE.Mesh(shoulderGeom, torsoMat);
  shR.position.set(0.52, 0.55, 0);
  g.add(shL, shR);

  // brazos
  const armGeom = new THREE.CylinderGeometry(0.10, 0.11, 0.75, 14);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.95 });
  const armL = new THREE.Mesh(armGeom, skinMat);
  armL.position.set(-0.62, 0.05, 0);
  armL.rotation.z = 0.25;
  const armR = new THREE.Mesh(armGeom, skinMat);
  armR.position.set(0.62, 0.05, 0);
  armR.rotation.z = -0.25;
  g.add(armL, armR);

  // guantes arquero
  if (isGK) {
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const gloveGeom = new THREE.BoxGeometry(0.18, 0.10, 0.18);
    const gloveL = new THREE.Mesh(gloveGeom, gloveMat);
    gloveL.position.set(-0.72, -0.30, 0);
    const gloveR = new THREE.Mesh(gloveGeom, gloveMat);
    gloveR.position.set(0.72, -0.30, 0);
    g.add(gloveL, gloveR);
  }

  // cabeza
  const headGeom = new THREE.SphereGeometry(0.30, 24, 24);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 1.25;
  g.add(head);

  // “cuello”
  const neckGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12);
  const neck = new THREE.Mesh(neckGeom, skinMat);
  neck.position.y = 0.95;
  g.add(neck);

  // etiqueta
  setLabel(g, name);

  // altura base
  g.position.y = 1;

  return g;
}

function addPlayer() {
  const teamA = { team: "A", shirt: 0x0066ff, shorts: 0x0b2a66 };
  const teamB = { team: "B", shirt: 0xffcc00, shorts: 0x333333 };

  const kit = nextTeam === 0 ? teamA : teamB;
  const defaultName = kit.team === "A" ? `A${counters.A++}` : `B${counters.B++}`;
  nextTeam = 1 - nextTeam;

  const custom = prompt("Nombre del jugador:", defaultName);
  const name = (custom && custom.trim()) ? custom.trim() : defaultName;

  const p = createHumanoid(THREE, kit, name, false);
  p.position.set(Math.random() * 10 - 5, 1, Math.random() * 6 - 3);

  root.add(p);
  players.push(p);
}

function addGoalkeeper() {
  const kit = { team: "GK", shirt: 0xff3333, shorts: 0x661111 };
  const defaultName = `GK${counters.GK++}`;

  const custom = prompt("Nombre del arquero:", defaultName);
  const name = (custom && custom.trim()) ? custom.trim() : defaultName;

  const gk = createHumanoid(THREE, kit, name, true);
  gk.position.set(0, 1, -8);

  root.add(gk);
  players.push(gk);
}

/* ===================== PICKING ===================== */
function getPlanePointFromMouse(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointWorld = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, pointWorld);

  return root.worldToLocal(pointWorld.clone());
}

function isArrowGroup(obj) {
  return arrows.some(a => a.group === obj);
}

function normalizeSelection(obj) {
  if (!obj) return null;
  let cur = obj;
  for (let i = 0; i < 8 && cur; i++) {
    if (isArrowGroup(cur)) return cur;
    cur = cur.parent;
  }
  return obj;
}

function pickUnderMouse(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const arrowGroups = arrows.map(a => a.group);
  const draggables = [...players, ball, ...arrowGroups].filter(Boolean);

  const hits = raycaster.intersectObjects(draggables, true);
  if (!hits.length) return null;

  const hit = hits[0].object;

  if (ball && (hit === ball || hit.parent === ball)) return ball;

  let obj = hit;
  for (let i = 0; i < 10 && obj; i++) {
    if (arrowGroups.includes(obj)) return obj;
    if (players.includes(obj)) return obj;
    obj = obj.parent;
  }
  return null;
}

/* ===================== FLECHAS ===================== */
function createArrowVisual(start, end) {
  const group = new THREE.Group();
  group.name = "arrow";

  const dir = end.clone().sub(start);
  const len = dir.length();
  const dirN = dir.clone().normalize();

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const lineGeom = new THREE.CylinderGeometry(0.06, 0.06, Math.max(0.01, len - 0.35), 12);
  const line = new THREE.Mesh(lineGeom, mat);

  line.position.copy(start.clone().add(end).multiplyScalar(0.5));
  line.position.y = 0.12;

  const axis = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(axis, new THREE.Vector3(dirN.x, 0, dirN.z).normalize());
  line.quaternion.copy(quat);

  const headGeom = new THREE.ConeGeometry(0.18, 0.35, 16);
  const head = new THREE.Mesh(headGeom, mat);
  head.position.copy(end);
  head.position.y = 0.18;
  head.quaternion.copy(quat);

  group.add(line, head);
  root.add(group);
  return { group, line, head };
}

function updateArrowVisual(arrow, start, end) {
  const dir = end.clone().sub(start);
  const len = dir.length();
  if (len < 0.05) return;

  const dirN = dir.clone().normalize();
  const axis = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(axis, new THREE.Vector3(dirN.x, 0, dirN.z).normalize());

  arrow.line.geometry.dispose();
  arrow.line.geometry = new THREE.CylinderGeometry(0.06, 0.06, Math.max(0.01, len - 0.35), 12);
  arrow.line.position.copy(start.clone().add(end).multiplyScalar(0.5));
  arrow.line.position.y = 0.12;
  arrow.line.quaternion.copy(quat);

  arrow.head.position.copy(end);
  arrow.head.position.y = 0.18;
  arrow.head.quaternion.copy(quat);
}

/* ===================== INPUT ===================== */
function onMouseDown(e) {
  // Dibujar flecha
  if (toolMode === "arrow") {
    const picked = pickUnderMouse(e);
    const startObj = (picked && players.includes(picked)) ? picked : null;
    const startPos = startObj ? startObj.position.clone() : getPlanePointFromMouse(e);

    const endPos = startPos.clone().add(new THREE.Vector3(0.01, 0, 0.01));
    const vis = createArrowVisual(startPos, endPos);
    arrowDraft = { ...vis, startObj, startPos, endPos };

    dragging = false;
    mapRotate.active = false;
    return;
  }

  const picked = normalizeSelection(pickUnderMouse(e));

  // Rotar cancha: click izq en vacío o click derecho
  if ((!picked && e.button === 0) || e.button === 2) {
    mapRotate.active = true;
    mapRotate.lastX = e.clientX;
    mapRotate.lastY = e.clientY;
    return;
  }

  if (!picked) return;

  selectedObject = picked;

  if (isArrowGroup(selectedObject)) {
    dragging = false;
    return;
  }

  dragging = true;
}

function onMouseMove(e) {
  if (mapRotate.active) {
    const dx = e.clientX - mapRotate.lastX;
    mapRotate.lastX = e.clientX;
    root.rotation.y -= dx * 0.005;
    return;
  }

  if (toolMode === "arrow" && arrowDraft) {
    const endPos = getPlanePointFromMouse(e);
    arrowDraft.endPos = endPos;
    updateArrowVisual(arrowDraft, arrowDraft.startPos, arrowDraft.endPos);
    return;
  }

  if (!dragging || !selectedObject) return;

  const p = getPlanePointFromMouse(e);
  selectedObject.position.x = p.x;
  selectedObject.position.z = p.z;
  selectedObject.position.y = (selectedObject === ball) ? 0.35 : 1;
}

function onMouseUp() {
  if (mapRotate.active) {
    mapRotate.active = false;
    return;
  }

  if (toolMode === "arrow" && arrowDraft) {
    const start = arrowDraft.startObj ? arrowDraft.startObj.position.clone() : arrowDraft.startPos.clone();
    const end = arrowDraft.endPos.clone();

    const arrowObj = {
      group: arrowDraft.group,
      line: arrowDraft.line,
      head: arrowDraft.head,
      start,
      end,
      fromName: arrowDraft.startObj ? arrowDraft.startObj.userData.label : null,
    };

    arrows.push(arrowObj);
    selectedObject = arrowObj.group;

    arrowDraft = null;
    toolMode = "move";
  }

  dragging = false;
}

/* ===================== RENOMBRAR ===================== */
function onDoubleClickRename(e) {
  const picked = normalizeSelection(pickUnderMouse(e));
  if (!picked) return;
  if (!players.includes(picked)) return;

  const current = picked.userData.label || "";
  const next = prompt("Nuevo nombre:", current);
  if (next && next.trim()) setLabel(picked, next.trim());
}

/* ===================== ANIMAR (flechas) ===================== */
function animatePlay() {
  const byName = new Map(players.map(p => [p.userData.label, p]));

  arrows.forEach(a => {
    let actor = null;
    if (a.fromName && byName.has(a.fromName)) actor = byName.get(a.fromName);

    if (!actor) {
      let best = null, bestD = 999;
      players.forEach(p => {
        const d = p.position.clone().setY(0).distanceTo(a.start.clone().setY(0));
        if (d < bestD) { bestD = d; best = p; }
      });
      if (best && bestD < 1.2) actor = best;
    }
    if (!actor) return;

    moveJobs.push({
      obj: actor,
      from: actor.position.clone(),
      to: new THREE.Vector3(a.end.x, actor.position.y, a.end.z),
      t: 0,
      dur: 0.9,
    });
  });
}

/* ===================== BORRAR ===================== */
function deleteSelected() {
  if (!selectedObject) return;
  selectedObject = normalizeSelection(selectedObject);

  const arrowIdx = arrows.findIndex(a => a.group === selectedObject);
  if (arrowIdx >= 0) {
    root.remove(arrows[arrowIdx].group);
    arrows.splice(arrowIdx, 1);
    selectedObject = null;
    return;
  }

  if (selectedObject === ball) {
    root.remove(ball);
    ball = null;
    selectedObject = null;
    return;
  }

  const pIdx = players.indexOf(selectedObject);
  if (pIdx >= 0) {
    root.remove(players[pIdx]);
    players.splice(pIdx, 1);
    selectedObject = null;
  }
}

/* ===================== GUARDAR / CARGAR ===================== */
function serializePlay() {
  return {
    players: players.map(p => ({
      name: p.userData.label,
      kind: p.userData.kind,
      team: p.userData.team,
      pos: { x: p.position.x, y: p.position.y, z: p.position.z },
    })),
    ball: ball ? { x: ball.position.x, y: ball.position.y, z: ball.position.z } : null,
    arrows: arrows.map(a => ({
      fromName: a.fromName || null,
      start: { x: a.start.x, y: a.start.y, z: a.start.z },
      end: { x: a.end.x, y: a.end.y, z: a.end.z },
    })),
    counters,
    nextTeam,
    rootYaw: root.rotation.y,
    cameraRadius,
  };
}

function clearPlay() {
  arrows.forEach(a => root.remove(a.group));
  arrows = [];

  players.forEach(p => root.remove(p));
  players = [];

  if (ball) root.remove(ball);
  ball = null;

  selectedObject = null;
  dragging = false;
  mapRotate.active = false;
  toolMode = "move";
  arrowDraft = null;
}

function savePlay() {
  localStorage.setItem("futsal_play_final", JSON.stringify(serializePlay()));
  console.log("✅ Jugada guardada");
}

function loadPlay() {
  const raw = localStorage.getItem("futsal_play_final");
  if (!raw) return console.warn("No hay jugada guardada");

  const data = JSON.parse(raw);
  clearPlay();

  counters = data.counters || counters;
  nextTeam = data.nextTeam ?? nextTeam;
  root.rotation.y = data.rootYaw || 0;

  cameraRadius = data.cameraRadius ?? cameraRadius;
  applyCamera();

  createBall();
  if (data.ball && ball) ball.position.set(data.ball.x, data.ball.y, data.ball.z);

  // recrear jugadores (kits)
  const teamA = { team: "A", shirt: 0x0066ff, shorts: 0x0b2a66 };
  const teamB = { team: "B", shirt: 0xffcc00, shorts: 0x333333 };
  const gkKit = { team: "GK", shirt: 0xff3333, shorts: 0x661111 };

  data.players.forEach(pp => {
    let kit = teamA;
    if (pp.team === "B") kit = teamB;
    if (pp.team === "GK") kit = gkKit;

    const isGK = pp.team === "GK";
    const p = createHumanoid(THREE, kit, pp.name, isGK);
    p.userData.kind = pp.kind;
    p.userData.team = pp.team;
    p.position.set(pp.pos.x, pp.pos.y, pp.pos.z);
    root.add(p);
    players.push(p);
  });

  // recrear flechas
  (data.arrows || []).forEach(ar => {
    const start = new THREE.Vector3(ar.start.x, ar.start.y, ar.start.z);
    const end = new THREE.Vector3(ar.end.x, ar.end.y, ar.end.z);
    const vis = createArrowVisual(start, end);
    arrows.push({ ...vis, start, end, fromName: ar.fromName || null });
  });

  console.log("✅ Jugada cargada");
}

/* ===================== GRABAR PANTALLA ===================== */
async function toggleScreenRecord() {
  try {
    if (!isScreenRecording) {
      // START
      recordedChunks = [];

    screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30, displaySurface: "browser" }, // prioriza pestaña/ventana
        audio: false, // si no querés audio
        });

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      mediaRecorder = new MediaRecorder(screenStream, { mimeType: mime });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Auto-descarga
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        const ts = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
        a.href = url;
        a.download = `futsal-tactica-${ts}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        // cortar tracks por prolijidad
        if (screenStream) {
          screenStream.getTracks().forEach(t => t.stop());
          screenStream = null;
        }
        mediaRecorder = null;

        isScreenRecording = false;
        syncScreenRecUI();
      };

      // si el usuario corta desde el navegador (Stop sharing), también paramos
      screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
      });

      mediaRecorder.start(250); // chunk cada 250ms
      isScreenRecording = true;
      syncScreenRecUI();
      return;
    }

    // STOP
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  } catch (err) {
    console.warn("No se pudo grabar pantalla:", err);
    isScreenRecording = false;
    syncScreenRecUI();
  }
}

function syncScreenRecUI() {
  if (!btnScreenRec) return;
  if (isScreenRecording) {
    btnScreenRec.textContent = "Detener";
    btnScreenRec.classList.add("recording");
  } else {
    btnScreenRec.textContent = "Grabar";
    btnScreenRec.classList.remove("recording");
  }
}

/* ===================== LOOP ===================== */
function animate() {
  requestAnimationFrame(animate);

  if (moveJobs.length) {
    const dt = 1 / 60;
    moveJobs = moveJobs.filter(job => {
      job.t += dt;
      const a = Math.min(1, job.t / job.dur);
      job.obj.position.x = job.from.x + (job.to.x - job.from.x) * a;
      job.obj.position.z = job.from.z + (job.to.z - job.from.z) * a;
      job.obj.position.y = 1;
      return a < 1;
    });
  }

  renderer.render(scene, camera);
}

/* ===================== HELPERS ===================== */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}