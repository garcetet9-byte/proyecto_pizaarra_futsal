// app.js

import { createFutsalCourtVisual } from "./FutsalCourtVisual.js";

import { createState } from "./src/state.js";
import { setupCore } from "./src/core/setup.js";

import { createBall } from "./src/entities/ball.js";
import { createPlayerSystem } from "./src/entities/player.js";

import { createPickingSystem } from "./src/interactions/picking.js";
import { createArrowSystem } from "./src/interactions/arrows.js";
import { createInputSystem } from "./src/interactions/input.js";

import { createAnimationSystem } from "./src/system/animation.js";
import { createStorageSystem } from "./src/system/storage.js";
import { createRecorderSystem } from "./src/system/recorder.js";

import { addStands } from "./src/world/stands.js";


// ============================
// 1️⃣ STATE
// ============================

const state = createState(THREE);


// ============================
// 2️⃣ CORE (scene/camera/root)
// ============================

setupCore(THREE, state);


// ============================
// 3️⃣ COURT
// ============================

const court = createFutsalCourtVisual(THREE, { length: 40, width: 20 });
state.root.add(court);


// ============================
// 4️⃣ BALL
// ============================

state.ball = createBall(THREE);
state.root.add(state.ball);


// ============================
// 5️⃣ STANDS
// ============================

addStands(THREE, state, { length: 40, width: 20 });


// ============================
// 6️⃣ SYSTEMS
// ============================

const players = createPlayerSystem(THREE, state);
const picking = createPickingSystem(THREE, state);
const arrows = createArrowSystem(THREE, state);
const anim = createAnimationSystem(THREE, state);
const storage = createStorageSystem(THREE, state, players, arrows);
const recorder = createRecorderSystem(state);

createInputSystem(THREE, state, { picking, arrows, players });


// ============================
// 7️⃣ UI
// ============================

window.addPlayer = players.addPlayer;
window.addGoalkeeper = players.addGoalkeeper;
window.addArrow = () => (state.toolMode = "arrow");
window.deleteSelected = players.deleteSelected;
window.savePlay = storage.savePlay;
window.loadPlay = storage.loadPlay;
window.animatePlay = anim.animatePlay;
window.toggleScreenRecord = recorder.toggleScreenRecord;


// ============================
// 8️⃣ LOOP
// ============================

function animate() {
  requestAnimationFrame(animate);

  anim.update();

  state.renderer.render(state.scene, state.camera);
}

animate();