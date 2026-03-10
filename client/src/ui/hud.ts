export function renderHUD() {
  const hud = document.createElement("div");
  hud.textContent = "Arelorian HUD online";
  hud.style.position = "fixed";
  hud.style.top = "12px";
  hud.style.left = "12px";
  hud.style.padding = "8px 12px";
  hud.style.background = "rgba(0,0,0,0.55)";
  hud.style.color = "#fff";
  hud.style.fontFamily = "sans-serif";
  document.body.appendChild(hud);
}