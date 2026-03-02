// FutsalCourtVisual.js
export function createFutsalCourtVisual(THREE, opts = {}) {
  const {
    length = 40,
    width = 20,
    lineWidth = 0.08,

    centerCircleR = 3,

    penaltyR = 6,
    goalInnerWidth = 3,
    postWidth = 0.08,
    penaltyMark = 6,
    secondPenaltyMark = 10,

    cornerArcR = 0.25,

    goalHeight = 2,
    goalDepth = 1.0,

    surfaceY = -0.006,
    markingsY = 0.01,
    disableRaycast = true,

    colors = {
      surface: 0x1e8f4d,
      lines: 0xffffff,
      goal: 0xffffff,
      net: 0xffffff,
    },
  } = opts;

  const court = new THREE.Group();
  court.name = "courtVisual";

  const surfaceMat = new THREE.MeshStandardMaterial({
    color: colors.surface,
    roughness: 0.95,
    metalness: 0.0,
  });

  const goalMat = new THREE.MeshStandardMaterial({
    color: colors.goal,
    roughness: 0.35,
    metalness: 0.1,
  });

  const netMat = new THREE.MeshStandardMaterial({
    color: colors.net,
    transparent: true,
    opacity: 0.12,
    roughness: 1.0,
  });

  const lineMat = new THREE.LineBasicMaterial({ color: colors.lines });

  const surface = new THREE.Group(); surface.name = "surface";
  const markings = new THREE.Group(); markings.name = "markings";
  const goals = new THREE.Group(); goals.name = "goals";
  court.add(surface, markings, goals);

  const L = length, W = width, lw = lineWidth;
  const hl = L * 0.5, hw = W * 0.5;

  const zEndLineCenter = hl - lw * 0.5;
  const xTouchLineCenter = hw - lw * 0.5;

  function addLine(a, b) {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const line = new THREE.Line(geo, lineMat);
    markings.add(line);
    return line;
  }

  function addArc(cx, cz, r, a0, a1, segments = 64) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const a = a0 + (a1 - a0) * t;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, markingsY, cz + Math.sin(a) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, lineMat);
    markings.add(line);
    return line;
  }

  function addCircle(cx, cz, r) { return addArc(cx, cz, r, 0, Math.PI * 2, 128); }
  function addSpot(cx, cz, r = 0.06) { return addCircle(cx, cz, r); }

  // =======================
  // Superficie (PISO)
  // =======================
  {
    const geom = new THREE.PlaneGeometry(W, L);
    const mesh = new THREE.Mesh(geom, surfaceMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = surfaceY;

    // ✅ clave para sombras
    mesh.receiveShadow = true;

    surface.add(mesh);
  }

  // Líneas exteriores
  addLine(new THREE.Vector3(-hw, markingsY,  zEndLineCenter), new THREE.Vector3(hw, markingsY,  zEndLineCenter));
  addLine(new THREE.Vector3(-hw, markingsY, -zEndLineCenter), new THREE.Vector3(hw, markingsY, -zEndLineCenter));
  addLine(new THREE.Vector3(-xTouchLineCenter, markingsY, -hl), new THREE.Vector3(-xTouchLineCenter, markingsY, hl));
  addLine(new THREE.Vector3( xTouchLineCenter, markingsY, -hl), new THREE.Vector3( xTouchLineCenter, markingsY, hl));

  // Mitad
  addLine(new THREE.Vector3(-hw, markingsY, 0), new THREE.Vector3(hw, markingsY, 0));

  // Centro
  addCircle(0, 0, centerCircleR);
  addSpot(0, 0, 0.06);

  // Esquinas
  const xCorner = hw - lw;
  const zCorner = hl - lw;
  addArc(-xCorner,  zCorner, cornerArcR, 0, Math.PI / 2, 32);
  addArc( xCorner,  zCorner, cornerArcR, Math.PI / 2, Math.PI, 32);
  addArc( xCorner, -zCorner, cornerArcR, Math.PI, Math.PI * 1.5, 32);
  addArc(-xCorner, -zCorner, cornerArcR, Math.PI * 1.5, Math.PI * 2, 32);

  // Área penal
  const outsideX = (goalInnerWidth * 0.5) + postWidth;
  const topHalf = outsideX;

  function addPenaltyArea(sign) {
    const goalLineZ = sign * zEndLineCenter;
    const inDir = -sign;
    const zFront = goalLineZ + inDir * penaltyR;

    addLine(new THREE.Vector3(-outsideX, markingsY, goalLineZ), new THREE.Vector3(-outsideX, markingsY, zFront));
    addLine(new THREE.Vector3( outsideX, markingsY, goalLineZ), new THREE.Vector3( outsideX, markingsY, zFront));
    addLine(new THREE.Vector3(-topHalf, markingsY, zFront), new THREE.Vector3(topHalf, markingsY, zFront));

    if (sign > 0) {
      addArc(-outsideX, goalLineZ, penaltyR, -Math.PI, -Math.PI / 2, 64);
      addArc( outsideX, goalLineZ, penaltyR, -Math.PI / 2, 0, 64);
    } else {
      addArc(-outsideX, goalLineZ, penaltyR, Math.PI / 2, Math.PI, 64);
      addArc( outsideX, goalLineZ, penaltyR, 0, Math.PI / 2, 64);
    }

    const goalLineBackEdgeZ = sign * hl;
    addSpot(0, goalLineBackEdgeZ - sign * penaltyMark, 0.06);
    addSpot(0, goalLineBackEdgeZ - sign * secondPenaltyMark, 0.06);
  }

  addPenaltyArea(+1);
  addPenaltyArea(-1);

  // =======================
  // Arcos (GOALS)
  // =======================
  function addGoal(sign, name) {
    const goal = new THREE.Group();
    goal.name = name;

    const rPost = postWidth * 0.5;
    const xPostCenter = (goalInnerWidth * 0.5) + rPost;

    const goalLineZ = sign * zEndLineCenter;
    const outDir = sign;

    const postGeom = new THREE.CylinderGeometry(rPost, rPost, goalHeight, 16);
    const crossGeom = new THREE.CylinderGeometry(rPost, rPost, xPostCenter * 2, 16);

    const pL = new THREE.Mesh(postGeom, goalMat);
    pL.position.set(-xPostCenter, goalHeight * 0.5, goalLineZ);

    const pR = new THREE.Mesh(postGeom, goalMat);
    pR.position.set(+xPostCenter, goalHeight * 0.5, goalLineZ);

    const cross = new THREE.Mesh(crossGeom, goalMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, goalHeight, goalLineZ);

    const zBack = goalLineZ + outDir * goalDepth;

    const bL = new THREE.Mesh(postGeom, goalMat);
    bL.position.set(-xPostCenter, goalHeight * 0.5, zBack);

    const bR = new THREE.Mesh(postGeom, goalMat);
    bR.position.set(+xPostCenter, goalHeight * 0.5, zBack);

    const crossBack = new THREE.Mesh(crossGeom, goalMat);
    crossBack.rotation.z = Math.PI / 2;
    crossBack.position.set(0, goalHeight, zBack);

    const netGeom = new THREE.BoxGeometry((xPostCenter * 2) + postWidth, goalHeight, goalDepth);
    const net = new THREE.Mesh(netGeom, netMat);
    net.position.set(0, goalHeight * 0.5, goalLineZ + outDir * (goalDepth * 0.5));

    // ✅ sombras para que se vea más real
    [pL, pR, cross, bL, bR, crossBack].forEach(m => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    net.castShadow = false;     // red muy liviana
    net.receiveShadow = true;

    goal.add(pL, pR, cross, bL, bR, crossBack, net);
    goals.add(goal);
  }

  addGoal(+1, "goal_north");
  addGoal(-1, "goal_south");

  // ✅ (Opcional) desactivar raycast para que no interfiera con picking
  if (disableRaycast) {
    court.traverse((o) => {
      if (o.isMesh) o.raycast = () => null;
    });
  }

  return court;
}