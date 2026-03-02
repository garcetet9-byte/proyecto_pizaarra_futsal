// src/system/storage.js

export function createStorageSystem(THREE, state, playerSystem, arrowSystem) {

  function serializePlay() {
    return {
      players: state.players.map(p => ({
        name: p.userData.label,
        kind: p.userData.kind,
        team: p.userData.team,
        pos: { x: p.position.x, y: p.position.y, z: p.position.z },
      })),
      ball: state.ball ? {
        x: state.ball.position.x,
        y: state.ball.position.y,
        z: state.ball.position.z
      } : null,
      arrows: state.arrows.map(a => ({
        fromName: a.fromName || null,
        start: { x: a.start.x, y: a.start.y, z: a.start.z },
        end: { x: a.end.x, y: a.end.y, z: a.end.z },
      })),
      counters: state.counters,
      nextTeam: state.nextTeam,
      rootYaw: state.root.rotation.y,
      cameraRadius: state.cameraRadius,
    };
  }

  function clearPlay() {
    state.arrows.forEach(a => state.root.remove(a.group));
    state.arrows = [];

    state.players.forEach(p => state.root.remove(p));
    state.players = [];

    if (state.ball) state.root.remove(state.ball);
    state.ball = null;

    state.selectedObject = null;
    state.dragging = false;
    state.mapRotate.active = false;
    state.toolMode = "move";
    state.arrowDraft = null;
  }

  function savePlay() {
    localStorage.setItem(
      "futsal_play_final",
      JSON.stringify(serializePlay())
    );
    console.log("✅ Jugada guardada");
  }

  function loadPlay() {
    const raw = localStorage.getItem("futsal_play_final");
    if (!raw) return console.warn("No hay jugada guardada");

    const data = JSON.parse(raw);
    clearPlay();

    state.counters = data.counters || state.counters;
    state.nextTeam = data.nextTeam ?? state.nextTeam;
    state.root.rotation.y = data.rootYaw || 0;

    state.cameraRadius = data.cameraRadius ?? state.cameraRadius;
    state.applyCamera();

    // Recrear pelota
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    ball.position.set(0, 0.35, 0);
    ball.name = "ball";

    state.ball = ball;
    state.root.add(ball);

    if (data.ball && state.ball) {
      state.ball.position.set(data.ball.x, data.ball.y, data.ball.z);
    }

    const teamA = { team: "A", shirt: 0x0066ff, shorts: 0x0b2a66 };
    const teamB = { team: "B", shirt: 0xffcc00, shorts: 0x333333 };
    const gkKit = { team: "GK", shirt: 0xff3333, shorts: 0x661111 };

    data.players.forEach(pp => {
      let kit = teamA;
      if (pp.team === "B") kit = teamB;
      if (pp.team === "GK") kit = gkKit;

      const isGK = pp.team === "GK";

      const p = playerSystem.createHumanoid(
        kit,
        pp.name,
        isGK
      );

      p.userData.kind = pp.kind;
      p.userData.team = pp.team;
      p.position.set(pp.pos.x, pp.pos.y, pp.pos.z);

      state.root.add(p);
      state.players.push(p);
    });

    (data.arrows || []).forEach(ar => {
      const start = new THREE.Vector3(
        ar.start.x,
        ar.start.y,
        ar.start.z
      );

      const end = new THREE.Vector3(
        ar.end.x,
        ar.end.y,
        ar.end.z
      );

      const vis = arrowSystem.createArrowVisual(start, end);

      state.arrows.push({
        ...vis,
        start,
        end,
        fromName: ar.fromName || null
      });
    });

    console.log("✅ Jugada cargada");
  }

  return { savePlay, loadPlay };
}