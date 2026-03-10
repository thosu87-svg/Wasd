import { initRenderer } from "./engine/renderer";
import { connectSocket } from "./networking/websocketClient";
import { renderHUD } from "./ui/hud";

const canvas = document.createElement("canvas");
document.body.style.margin = "0";
document.body.appendChild(canvas);

initRenderer(canvas);
connectSocket();
renderHUD();