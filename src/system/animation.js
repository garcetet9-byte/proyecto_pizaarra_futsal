// src/system/animation.js

export function createAnimationSystem(THREE, state) {

  function animatePlay() {

    const sel = state.selectedObject;
    const arrowIdx = sel
      ? state.arrows.findIndex(a => a.group === sel)
      : -1;

    if (arrowIdx < 0) {
      alert("Seleccioná una flecha.");
      return;
    }

    const arrow = state.arrows[arrowIdx];

    const player = state.players.find(p =>
      arrow.fromName
        ? p.userData.label === arrow.fromName
        : p.position.distanceTo(arrow.start) < 1.2
    );

    if (!player) {
      alert("No se encontró jugador.");
      return;
    }

    state.moveJobs = [{
      obj: player,
      arrow,
      t: 0,
      dur: 2.5
    }];
  }

  function update() {

    if (!state.moveJobs?.length) return;

    const dt = 1 / 60;

    state.moveJobs = state.moveJobs.filter(job => {

      job.t += dt;
      const alpha = Math.min(1, job.t / job.dur);

      if (job.arrow.curveData?.type === "curve") {

        const pos = job.arrow.curveData.curve.getPoint(alpha);

        job.obj.position.x = pos.x;
        job.obj.position.z = pos.z;

      } else {

        const start = job.arrow.start;
        const end = job.arrow.end;

        job.obj.position.x =
          start.x + (end.x - start.x) * alpha;

        job.obj.position.z =
          start.z + (end.z - start.z) * alpha;
      }

      job.obj.position.y = 1;

      return alpha < 1;
    });
  }

  return { animatePlay, update };
}