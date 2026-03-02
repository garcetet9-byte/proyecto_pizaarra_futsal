// src/state.js
export function createState(THREE) {
  return {
    THREE,

    scene: null,
    camera: null,
    renderer: null,
    root: null,

    players: [],
    arrows: [],
    ball: null,

    selectedObject: null,
    dragging: false,

    toolMode: "move", // "move" | "arrow"
    arrowDraft: null,

    // camera board style
    CAMERA_LOOK: new THREE.Vector3(0, 0, 0),
    cameraRadius: 40,
    cameraDir: new THREE.Vector3(0, 0.73, 0.68).normalize(),

    // map rotation
    mapRotate: { active: false, lastX: 0, lastY: 0 },

    // animation jobs
    moveJobs: [],

    // teams/names
    nextTeam: 0,
    counters: { A: 1, B: 1, GK: 1 },

    // recorder
    screenStream: null,
    mediaRecorder: null,
    recordedChunks: [],
    isScreenRecording: false,
    btnScreenRec: null,

    // helpers injected
    applyCamera: null,
  };
}