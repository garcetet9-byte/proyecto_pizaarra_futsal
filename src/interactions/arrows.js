// src/interactions/arrows.js

export function createArrowSystem(THREE, state) {

  function clearGroup(group) {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
  }

  function addArrowHead(group, end, direction) {

    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.6, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );

    head.position.set(end.x, 0.45, end.z);

    head.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );

    head.castShadow = true;
    group.add(head);
  }

  function buildStraight(arrowObj, start, end) {

    const group = arrowObj.group;

    const dir = end.clone().sub(start);
    const length = dir.length();
    if (length < 0.1) return;

    const dirNorm = dir.clone().normalize();

    const dashLength = 0.7;
    const gapLength = 0.4;

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3
    });

    let traveled = 0;

    while (traveled < length - dashLength) {

      const segment = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, dashLength, 8),
        material
      );

      const mid = start.clone()
        .add(dirNorm.clone().multiplyScalar(traveled + dashLength / 2));

      segment.position.set(mid.x, 0.3, mid.z);

      segment.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dirNorm
      );

      segment.castShadow = true;
      group.add(segment);

      traveled += dashLength + gapLength;
    }

    addArrowHead(group, end, dirNorm);

    arrowObj.curveData = {
      type: "straight",
      start: start.clone(),
      end: end.clone()
    };
  }

  function buildCurve(arrowObj, start, end, side) {

    const group = arrowObj.group;

    const dir = end.clone().sub(start);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const strength = Math.min(3, dir.length() * 0.25);

    const control = mid.clone().add(
      normal.multiplyScalar(side === "left" ? strength : -strength)
    );

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(start.x, 0.3, start.z),
      new THREE.Vector3(control.x, 0.3, control.z),
      new THREE.Vector3(end.x, 0.3, end.z)
    );

    const points = curve.getPoints(50);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3
    });

    for (let i = 0; i < points.length - 1; i += 2) {

      const p1 = points[i];
      const p2 = points[i + 1];

      const segmentDir = p2.clone().sub(p1);
      const segmentLength = segmentDir.length();

      const segment = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, segmentLength, 8),
        material
      );

      segment.position.copy(
        p1.clone().add(p2).multiplyScalar(0.5)
      );

      segment.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        segmentDir.clone().normalize()
      );

      segment.castShadow = true;
      group.add(segment);
    }

    const tangent = curve.getTangent(1).normalize();
    addArrowHead(group, end, tangent);

    arrowObj.curveData = {
      type: "curve",
      curve
    };
  }

  function buildArrow(arrowObj, start, end) {

    clearGroup(arrowObj.group);

    const type = document.getElementById("arrowType")?.value || "straight";

    if (type === "straight") {
      buildStraight(arrowObj, start, end);
    } 
    else if (type === "curveLeft") {
      buildCurve(arrowObj, start, end, "left");
    } 
    else if (type === "curveRight") {
      buildCurve(arrowObj, start, end, "right");
    }
  }

  function createArrowVisual(start, end) {

    const group = new THREE.Group();
    group.name = "arrow";
    state.root.add(group);

    const arrowObj = {
      group,
      start,
      end,
      fromName: null,
      curveData: null
    };

    buildArrow(arrowObj, start, end);

    return arrowObj;
  }

  function updateArrowVisual(arrowObj, start, end) {
    arrowObj.start = start;
    arrowObj.end = end;
    buildArrow(arrowObj, start, end);
  }

  return {
    createArrowVisual,
    updateArrowVisual
  };
}