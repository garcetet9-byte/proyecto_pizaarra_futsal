// src/core/setup.js
export function setupCore(THREE, state) {

  // SCENE
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b6623);
  state.scene = scene;

  // CAMERA
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  state.camera = camera;

  state.applyCamera = function () {
    const pos = state.cameraDir.clone().multiplyScalar(state.cameraRadius);
    state.camera.position.copy(pos);
    state.camera.lookAt(state.CAMERA_LOOK);
  };
  state.applyCamera();

  // RENDERER
  const canvas = document.getElementById("scene");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  state.renderer = renderer;

  // LIGHTS
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(20, 30, 20);

dir.castShadow = true;

dir.shadow.mapSize.width = 2048;
dir.shadow.mapSize.height = 2048;

dir.shadow.camera.near = 1;
dir.shadow.camera.far = 100;
dir.shadow.camera.left = -50;
dir.shadow.camera.right = 50;
dir.shadow.camera.top = 50;
dir.shadow.camera.bottom = -50;

scene.add(dir);

  // ROOT
  const root = new THREE.Group();
  scene.add(root);
  state.root = root;

  // EVENTS
  window.addEventListener("resize", () => {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.cameraRadius += e.deltaY * 0.03;
    state.cameraRadius = Math.max(18, Math.min(90, state.cameraRadius));
    state.applyCamera();
  }, { passive: false });

  window.addEventListener("contextmenu", (e) => e.preventDefault());
}