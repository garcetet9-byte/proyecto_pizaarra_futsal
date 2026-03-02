// src/interactions/input.js
export function createInputSystem(THREE, state, systems) {
  const { picking, arrows, players } = systems;

  function forceStopAll() {
    state.mapRotate.active = false;
    state.dragging = false;
    state.arrowDraft = null;
    state.toolMode = "move";
  }

  function onMouseDown(e) {
    if (state.toolMode === "arrow") {
      const picked = picking.pickUnderMouse(e);
      const startObj = (picked && state.players.includes(picked)) ? picked : null;
      const startPos = startObj ? startObj.position.clone() : picking.getPlanePointFromMouse(e);

      const endPos = startPos.clone().add(new THREE.Vector3(0.01, 0, 0.01));
      const vis = arrows.createArrowVisual(startPos, endPos);
      state.arrowDraft = { ...vis, startObj, startPos, endPos };

      state.dragging = false;
      state.mapRotate.active = false;
      return;
    }

    const picked = state.normalizeSelection(picking.pickUnderMouse(e));

    // Rotar cancha: click izq en vacío o click derecho
    if ((!picked && e.button === 0) || e.button === 2) {
      state.mapRotate.active = true;
      state.mapRotate.lastX = e.clientX;
      state.mapRotate.lastY = e.clientY;
      return;
    }

    if (!picked) return;

    state.selectedObject = picked;

    if (picking.isArrowGroup(state.selectedObject)) {
      state.dragging = false;
      return;
    }

    state.dragging = true;
  }

  function onMouseMove(e) {
    if (state.mapRotate.active) {
      const dx = e.clientX - state.mapRotate.lastX;
      state.mapRotate.lastX = e.clientX;
      state.root.rotation.y -= dx * 0.005;
      return;
    }

    if (state.toolMode === "arrow" && state.arrowDraft) {
      const endPos = picking.getPlanePointFromMouse(e);
      state.arrowDraft.endPos = endPos;
      arrows.updateArrowVisual(state.arrowDraft, state.arrowDraft.startPos, state.arrowDraft.endPos);
      return;
    }

    if (!state.dragging || !state.selectedObject) return;

    const p = picking.getPlanePointFromMouse(e);
    state.selectedObject.position.x = p.x;
    state.selectedObject.position.z = p.z;
    state.selectedObject.position.y = (state.selectedObject === state.ball) ? 0.35 : 1;
  }

function onMouseUp() {

  if (state.mapRotate.active) {
    state.mapRotate.active = false;
    return;
  }

  if (state.toolMode === "arrow" && state.arrowDraft) {

    const arrowObj = state.arrowDraft;

    arrowObj.start = arrowObj.startObj
      ? arrowObj.startObj.position.clone()
      : arrowObj.startPos.clone();

    arrowObj.end = arrowObj.endPos.clone();

    arrowObj.fromName = arrowObj.startObj
      ? arrowObj.startObj.userData.label
      : null;

    state.arrows.push(arrowObj);

    state.selectedObject = arrowObj.group;

    state.arrowDraft = null;
    state.toolMode = "move";
  }

  state.dragging = false;
}

  function onDoubleClickRename(e) {
    const picked = state.normalizeSelection(picking.pickUnderMouse(e));
    if (!picked) return;
    if (!state.players.includes(picked)) return;
    players.renamePlayer(picked);
  }

  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  window.addEventListener("mouseleave", forceStopAll);
  window.addEventListener("blur", forceStopAll);

  window.addEventListener("dblclick", onDoubleClickRename);
}