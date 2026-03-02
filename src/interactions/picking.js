// src/interactions/picking.js
export function createPickingSystem(THREE, state) {
  state.raycaster = new THREE.Raycaster();
  state.mouse = new THREE.Vector2();

  function getPlanePointFromMouse(e) {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    state.raycaster.setFromCamera(state.mouse, state.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pointWorld = new THREE.Vector3();
    state.raycaster.ray.intersectPlane(plane, pointWorld);

    return state.root.worldToLocal(pointWorld.clone());
  }

  function isArrowGroup(obj) {
    return state.arrows.some(a => a.group === obj);
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
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    state.raycaster.setFromCamera(state.mouse, state.camera);

    const arrowGroups = state.arrows.map(a => a.group);
    const draggables = [...state.players, state.ball, ...arrowGroups].filter(Boolean);

    const hits = state.raycaster.intersectObjects(draggables, true);
    if (!hits.length) return null;

    const hit = hits[0].object;

    if (state.ball && (hit === state.ball || hit.parent === state.ball)) return state.ball;

    let obj = hit;
    for (let i = 0; i < 10 && obj; i++) {
      if (arrowGroups.includes(obj)) return obj;
      if (state.players.includes(obj)) return obj;
      obj = obj.parent;
    }
    return null;
  }

  // export + attach to state for other modules
  state.normalizeSelection = normalizeSelection;

  return { getPlanePointFromMouse, pickUnderMouse, normalizeSelection, isArrowGroup };
}