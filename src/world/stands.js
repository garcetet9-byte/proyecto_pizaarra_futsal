// src/world/stands.js

export function addStands(THREE, state, { length, width }) {

  const group = new THREE.Group();

  const L = length;
  const W = width;

  const tiers = 10;
  const stepHeight = 0.6;
  const stepDepth = 2.0;

  const material = new THREE.MeshStandardMaterial({
    color: 0x9a9a9a,
    roughness: 0.85
  });

  function createNorth() {
    for (let i = 0; i < tiers; i++) {

      const geo = new THREE.BoxGeometry(
        W + 20,
        stepHeight,
        stepDepth
      );

      const step = new THREE.Mesh(geo, material);

      step.position.set(
        0,
        stepHeight * 0.5 + i * stepHeight,
        -(L * 0.5 + 2 + i * stepDepth)
      );

      group.add(step);
    }
  }

  function createSouth() {
    for (let i = 0; i < tiers; i++) {

      const geo = new THREE.BoxGeometry(
        W + 20,
        stepHeight,
        stepDepth
      );

      const step = new THREE.Mesh(geo, material);

      step.position.set(
        0,
        stepHeight * 0.5 + i * stepHeight,
        (L * 0.5 + 2 + i * stepDepth)
      );

      group.add(step);
    }
  }

  function createEast() {
    for (let i = 0; i < tiers; i++) {

      const geo = new THREE.BoxGeometry(
        stepDepth,
        stepHeight,
        L + 20
      );

      const step = new THREE.Mesh(geo, material);

      step.position.set(
        (W * 0.5 + 2 + i * stepDepth),
        stepHeight * 0.5 + i * stepHeight,
        0
      );

      group.add(step);
    }
  }

  function createWest() {
    for (let i = 0; i < tiers; i++) {

      const geo = new THREE.BoxGeometry(
        stepDepth,
        stepHeight,
        L + 20
      );

      const step = new THREE.Mesh(geo, material);

      step.position.set(
        -(W * 0.5 + 2 + i * stepDepth),
        stepHeight * 0.5 + i * stepHeight,
        0
      );

      group.add(step);
    }
  }

  createNorth();
  createSouth();
  createEast();
  createWest();

  state.root.add(group);
}