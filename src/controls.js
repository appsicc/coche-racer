export const controls = {
  forward: false,
  brake: false,
  left: false,
  right: false,
  nitro: false
};

export function createControls() {
  window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (k === "w" || e.code === "ArrowUp") controls.forward = true;
    if (k === "s" || e.code === "ArrowDown") controls.brake = true;
    if (k === "a" || e.code === "ArrowLeft") controls.left = true;
    if (k === "d" || e.code === "ArrowRight") controls.right = true;
    if (e.code === "Space") controls.nitro = true;
  });

  window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();
    if (k === "w" || e.code === "ArrowUp") controls.forward = false;
    if (k === "s" || e.code === "ArrowDown") controls.brake = false;
    if (k === "a" || e.code === "ArrowLeft") controls.left = false;
    if (k === "d" || e.code === "ArrowRight") controls.right = false;
    if (e.code === "Space") controls.nitro = false;
  });

  bindButton("gasBtn", "forward");
  bindButton("brakeBtn", "brake");
  bindButton("leftBtn", "left");
  bindButton("rightBtn", "right");
  bindButton("nitroBtn", "nitro");
}

function bindButton(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;

  const down = e => {
    e.preventDefault();
    controls[key] = true;
  };

  const up = e => {
    e.preventDefault();
    controls[key] = false;
  };

  btn.addEventListener("touchstart", down, { passive: false });
  btn.addEventListener("touchend", up, { passive: false });
  btn.addEventListener("touchcancel", up, { passive: false });
  btn.addEventListener("mousedown", down);
  btn.addEventListener("mouseup", up);
  btn.addEventListener("mouseleave", up);
}
