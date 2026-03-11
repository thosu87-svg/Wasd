import { sendDialogueChoice } from "../networking/websocketClient";

export function renderHUD() {
  const hud = document.createElement("div");
  hud.id = "main-hud";
  hud.style.position = "fixed";
  hud.style.top = "12px";
  hud.style.left = "12px";
  hud.style.padding = "12px";
  hud.style.background = "rgba(0,0,0,0.7)";
  hud.style.color = "#fff";
  hud.style.fontFamily = "sans-serif";
  hud.style.borderRadius = "8px";
  hud.style.display = "flex";
  hud.style.flexDirection = "column";
  hud.style.gap = "6px";
  hud.style.minWidth = "200px";
  hud.style.border = "1px solid rgba(255,255,255,0.1)";
  
  hud.innerHTML = `
    <div style="font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; margin-bottom: 4px; color: #00ff00;">Areloria Alpha</div>
    <div id="hud-stats" style="font-size: 0.9em;">
      Gold: 0 | XP: 0
    </div>
    <div id="hud-inventory" style="font-size: 0.8em; color: #ffcc00;">
      Inv: Empty
    </div>
    <div id="hud-reputation" style="font-size: 0.8em; color: #ff99ff;">
      Rep: None
    </div>
    <div id="hud-equipment" style="font-size: 0.8em; color: #00ccff;">
      Equip: None
    </div>
    <div id="hud-quests" style="font-size: 0.85em; color: #aaa; font-style: italic;">
      Active Quest: None
    </div>
    <div id="hud-cooldowns" style="font-size: 0.8em; margin-top: 4px; display: flex; gap: 8px;">
      <span id="cd-attack" style="color: #00ff00; opacity: 0.5;">[F] Attack</span>
      <span id="cd-interact" style="color: #00ff00; opacity: 0.5;">[E] Interact</span>
      <span id="cd-equip" style="color: #00ff00; opacity: 0.5;">[G] Equip</span>
    </div>
    <div style="font-size: 0.75em; margin-top: 6px; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
      WASD: Move | E: Interact | F: Attack | G: Equip First | H: Unequip
    </div>
  `;
  
  document.body.appendChild(hud);
}

export function updateHUD(data: { gold: number, xp: number, quests: any[], inventory: any[], equipment?: any, reputation?: any, questStatus?: any[] }) {
  const stats = document.getElementById("hud-stats");
  if (stats) {
    stats.textContent = `Gold: ${data.gold} | XP: ${data.xp}`;
  }

  const inv = document.getElementById("hud-inventory");
  if (inv) {
    const items = data.inventory.map(i => i.name).join(", ");
    inv.textContent = items ? `Inv: ${items}` : "Inv: Empty";
  }

  const rep = document.getElementById("hud-reputation");
  if (rep) {
    const repStr = data.reputation ? Object.entries(data.reputation).map(([k, v]) => `${k}: ${v}`).join(", ") : "None";
    rep.textContent = `Rep: ${repStr}`;
  }

  const equip = document.getElementById("hud-equipment");
  if (equip && data.equipment) {
    const weapon = data.equipment.weapon ? data.equipment.weapon.name : "None";
    equip.textContent = `Weapon: ${weapon}`;
  }
  
  const questContainer = document.getElementById("hud-quests");
  if (questContainer && data.questStatus) {
    questContainer.innerHTML = `<strong>Quests:</strong><br/>` + data.questStatus.map((q: any) => 
      `<div style="color: ${q.state === 'active' ? '#00ff00' : q.state === 'completed' ? '#aaa' : q.state === 'available' ? '#ffff00' : '#ff4444'}">
        ${q.title} [${q.state}]
      </div>`
    ).join("");
  }
}

export function updateCooldowns(cooldowns: { attack: number, interact: number, equip: number }) {
  const now = Date.now();
  
  const updateCd = (id: string, remaining: number) => {
    const el = document.getElementById(id);
    if (el) {
      if (remaining > 0) {
        el.style.opacity = "1";
        el.style.color = "#ff4444";
        el.style.fontWeight = "bold";
        // Show percentage or just dimmed
        const percent = Math.ceil((remaining / 1000) * 10) / 10;
        el.textContent = `[${id.split("-")[1].toUpperCase().charAt(0)}] ${remaining > 100 ? (remaining/1000).toFixed(1) + "s" : "..."}`;
      } else {
        el.style.opacity = "0.5";
        el.style.color = "#00ff00";
        el.style.fontWeight = "normal";
        const label = id === "cd-attack" ? "Attack" : id === "cd-interact" ? "Interact" : "Equip";
        const key = id === "cd-attack" ? "F" : id === "cd-interact" ? "E" : "G";
        el.textContent = `[${key}] ${label}`;
      }
    }
  };

  const attackRemaining = Math.max(0, cooldowns.attack - now);
  const interactRemaining = Math.max(0, cooldowns.interact - now);
  const equipRemaining = Math.max(0, cooldowns.equip - now);

  updateCd("cd-attack", attackRemaining);
  updateCd("cd-interact", interactRemaining);
  updateCd("cd-equip", equipRemaining);
}

export function showDialogue(source: string, text: string, choices: any[] = [], npcId?: string) {
  let dialogueBox = document.getElementById("dialogue-box");
  if (!dialogueBox) {
    dialogueBox = document.createElement("div");
    dialogueBox.id = "dialogue-box";
    dialogueBox.style.position = "fixed";
    dialogueBox.style.bottom = "20px";
    dialogueBox.style.left = "50%";
    dialogueBox.style.transform = "translateX(-50%)";
    dialogueBox.style.background = "rgba(0, 0, 0, 0.9)";
    dialogueBox.style.color = "#fff";
    dialogueBox.style.padding = "20px 30px";
    dialogueBox.style.borderRadius = "12px";
    dialogueBox.style.fontFamily = "sans-serif";
    dialogueBox.style.minWidth = "400px";
    dialogueBox.style.maxWidth = "600px";
    dialogueBox.style.textAlign = "left";
    dialogueBox.style.boxShadow = "0 10px 25px rgba(0,0,0,0.5)";
    dialogueBox.style.border = "1px solid rgba(255,255,255,0.1)";
    dialogueBox.style.zIndex = "1000";
    document.body.appendChild(dialogueBox);
  }
  
  let html = `<div style="margin-bottom: 12px;"><strong style="color: #00ff00; font-size: 1.1em;">${source}:</strong> <span style="line-height: 1.4;">${text}</span></div>`;
  
  if (choices && choices.length > 0 && npcId) {
    html += `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">`;
    choices.forEach((choice, index) => {
      html += `
        <button 
          class="dialogue-choice-btn" 
          data-npc-id="${npcId}" 
          data-node-id="${choice.nextNodeId}"
          data-choice-id="${choice.id}"
          style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; text-align: left; transition: all 0.2s;"
          onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.borderColor='#00ff00';"
          onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.2)';"
        >
          ${index + 1}. ${choice.text}
        </button>
      `;
    });
    html += `</div>`;
  } else {
    html += `<div style="font-size: 0.8em; opacity: 0.5; margin-top: 12px; text-align: center;">(Press E to continue)</div>`;
  }
  
  dialogueBox.innerHTML = html;

  // Add event listeners to buttons
  const buttons = dialogueBox.querySelectorAll(".dialogue-choice-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const nid = target.getAttribute("data-npc-id");
      const node = target.getAttribute("data-node-id");
      const choiceId = target.getAttribute("data-choice-id");
      if (nid && node && choiceId) {
        sendDialogueChoice(nid, node, choiceId);
      }
    });
  });
  
  // Auto-hide after 10 seconds if no choices
  if ((window as any).dialogueTimeout) {
    clearTimeout((window as any).dialogueTimeout);
  }
  
  if (!choices || choices.length === 0) {
    (window as any).dialogueTimeout = setTimeout(() => {
      if (dialogueBox && dialogueBox.parentNode) {
        dialogueBox.parentNode.removeChild(dialogueBox);
      }
    }, 5000);
  }
}
