// src/entities/ball.js

export function createBall(THREE) {

  const geometry = new THREE.SphereGeometry(0.35, 64, 64);

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1
  });

  const ball = new THREE.Mesh(geometry, material);

  ball.castShadow = true;
  ball.receiveShadow = true;

  ball.position.set(0, 0.35, 0);
  ball.name = "ball";

  // Paneles negros distribuidos mejor
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5
  });

  const panelGeom = new THREE.CircleGeometry(0.12, 6);

  const positions = [
    [0, 0.35, 0],
    [0, -0.35, 0],
    [0.35, 0, 0],
    [-0.35, 0, 0],
    [0, 0, 0.35],
    [0, 0, -0.35]
  ];

  positions.forEach(p => {
    const patch = new THREE.Mesh(panelGeom, panelMaterial);

    patch.position.set(p[0] * 0.7, p[1] * 0.7, p[2] * 0.7);
    patch.lookAt(0, 0, 0);

    ball.add(patch);
  });

  return ball;
}