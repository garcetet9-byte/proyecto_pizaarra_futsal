// src/entities/player.js
import { setLabel } from "./label.js";

export function createPlayerSystem(THREE, state) {
  function createHumanoid(kit, name, isGK = false) {
    const g = new THREE.Group();
    g.userData.kind = isGK ? "goalkeeper" : "player";
    g.userData.team = kit.team;

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 28),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.02;
    g.add(shadow);

    const legMat = new THREE.MeshStandardMaterial({ color: kit.shorts, roughness: 0.8 });
    const legGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.8, 14);

    const legL = new THREE.Mesh(legGeom, legMat);
    legL.position.set(-0.18, -0.7, 0);
    const legR = new THREE.Mesh(legGeom, legMat);
    legR.position.set(0.18, -0.7, 0);
    g.add(legL, legR);

    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const bootGeom = new THREE.BoxGeometry(0.18, 0.08, 0.32);
    const bootL = new THREE.Mesh(bootGeom, bootMat);
    bootL.position.set(-0.18, -1.12, 0.08);
    const bootR = new THREE.Mesh(bootGeom, bootMat);
    bootR.position.set(0.18, -1.12, 0.08);
    g.add(bootL, bootR);

    const torsoMat = new THREE.MeshStandardMaterial({ color: kit.shirt, roughness: 0.6 });
    const torsoGeom = new THREE.CapsuleGeometry(0.42, 0.95, 6, 16);
    const torso = new THREE.Mesh(torsoGeom, torsoMat);
    torso.position.y = 0.15;
    g.add(torso);

    const shoulderGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const shL = new THREE.Mesh(shoulderGeom, torsoMat);
    shL.position.set(-0.52, 0.55, 0);
    const shR = new THREE.Mesh(shoulderGeom, torsoMat);
    shR.position.set(0.52, 0.55, 0);
    g.add(shL, shR);

    const armGeom = new THREE.CylinderGeometry(0.10, 0.11, 0.75, 14);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.95 });
    const armL = new THREE.Mesh(armGeom, skinMat);
    armL.position.set(-0.62, 0.05, 0);
    armL.rotation.z = 0.25;
    const armR = new THREE.Mesh(armGeom, skinMat);
    armR.position.set(0.62, 0.05, 0);
    armR.rotation.z = -0.25;
    g.add(armL, armR);

    if (isGK) {
      const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
      const gloveGeom = new THREE.BoxGeometry(0.18, 0.10, 0.18);
      const gloveL = new THREE.Mesh(gloveGeom, gloveMat);
      gloveL.position.set(-0.72, -0.30, 0);
      const gloveR = new THREE.Mesh(gloveGeom, gloveMat);
      gloveR.position.set(0.72, -0.30, 0);
      g.add(gloveL, gloveR);
    }

    const headGeom = new THREE.SphereGeometry(0.30, 24, 24);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.y = 1.25;
    g.add(head);

    const neckGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12);
    const neck = new THREE.Mesh(neckGeom, skinMat);
    neck.position.y = 0.95;
    g.add(neck);

    setLabel(THREE, g, name);
    g.position.y = 1;
    return g;
  }

function addPlayer() {

  const teamSelected =
    document.getElementById("teamSelect").value;

  const teamA = { team: "A", shirt: 0x0066ff, shorts: 0x0b2a66 };
  const teamB = { team: "B", shirt: 0xffcc00, shorts: 0x333333 };

  const kit = teamSelected === "A" ? teamA : teamB;

  const defaultName =
    kit.team === "A"
      ? `A${state.counters.A++}`
      : `B${state.counters.B++}`;

  const custom = prompt("Nombre del jugador:", defaultName);
  const name =
    (custom && custom.trim())
      ? custom.trim()
      : defaultName;

  const p = createHumanoid(kit, name, false);

  p.position.set(
    Math.random() * 10 - 5,
    1,
    Math.random() * 6 - 3
  );

  state.root.add(p);
  state.players.push(p);
}

  function addGoalkeeper() {
    const kit = { team: "GK", shirt: 0xff3333, shorts: 0x661111 };
    const defaultName = `GK${state.counters.GK++}`;

    const custom = prompt("Nombre del arquero:", defaultName);
    const name = (custom && custom.trim()) ? custom.trim() : defaultName;

    const gk = createHumanoid(kit, name, true);
    gk.position.set(0, 1, -8);

    state.root.add(gk);
    state.players.push(gk);
  }

  function deleteSelected() {
    if (!state.selectedObject) return;
    state.selectedObject = state.normalizeSelection(state.selectedObject);

    // flecha
    const arrowIdx = state.arrows.findIndex(a => a.group === state.selectedObject);
    if (arrowIdx >= 0) {
      state.root.remove(state.arrows[arrowIdx].group);
      state.arrows.splice(arrowIdx, 1);
      state.selectedObject = null;
      return;
    }

    // ball
    if (state.selectedObject === state.ball) {
      state.root.remove(state.ball);
      state.ball = null;
      state.selectedObject = null;
      return;
    }

    // player
    const pIdx = state.players.indexOf(state.selectedObject);
    if (pIdx >= 0) {
      state.root.remove(state.players[pIdx]);
      state.players.splice(pIdx, 1);
      state.selectedObject = null;
    }
  }

  function renamePlayer(picked) {
    const current = picked.userData.label || "";
    const next = prompt("Nuevo nombre:", current);
    if (next && next.trim()) setLabel(THREE, picked, next.trim());
  }

  return { addPlayer, addGoalkeeper, deleteSelected, createHumanoid, renamePlayer };
}