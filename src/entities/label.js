// src/entities/label.js

export function makeLabelSprite(THREE, text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const font = "bold 48px Arial";
  ctx.font = font;

  const pad = 18;
  const w = Math.ceil(ctx.measureText(text).width + pad * 2);
  const h = 72;

  canvas.width = w;
  canvas.height = h;

  ctx.font = font;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, 0, 0, w, h, 16);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 1.0, 1.0);
  sprite.renderOrder = 999;

  return sprite;
}

export function setLabel(THREE, player, newName) {
  player.userData.label = newName;

  const old = player.getObjectByName("labelSprite");
  if (old) player.remove(old);

  const label = makeLabelSprite(THREE, newName);
  label.name = "labelSprite";
  label.position.set(0, 2.15, 0);

  player.add(label);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}