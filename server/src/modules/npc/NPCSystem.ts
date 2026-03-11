import { NPCPersonalityEngine } from "./NPCPersonalityEngine.js";
import { NPCMemoryEngine } from "./NPCMemoryEngine.js";
import { NPCGenealogyEngine } from "./NPCGenealogyEngine.js";
import fs from "fs";
import path from "path";

export class NPCSystem {
  private npcs: Map<string, any> = new Map();
  private npcDefinitions: Map<string, any> = new Map();
  private dialogues: Map<string, any> = new Map();

  public personalityEngine: NPCPersonalityEngine;
  public memoryEngine: NPCMemoryEngine;
  public genealogyEngine: NPCGenealogyEngine;

  constructor() {
    this.personalityEngine = new NPCPersonalityEngine();
    this.memoryEngine = new NPCMemoryEngine();
    this.genealogyEngine = new NPCGenealogyEngine();
    this.loadData();
  }

  private loadData() {
    try {
      const npcsPath = path.resolve(process.cwd(), "game-data/npc/npcs.json");
      const dialoguesPath = path.resolve(process.cwd(), "game-data/dialogue/dialogues.json");

      if (fs.existsSync(npcsPath)) {
        const npcData = JSON.parse(fs.readFileSync(npcsPath, "utf-8"));
        npcData.forEach((npc: any) => this.npcDefinitions.set(npc.id, npc));
      }

      if (fs.existsSync(dialoguesPath)) {
        const dialogueData = JSON.parse(fs.readFileSync(dialoguesPath, "utf-8"));
        dialogueData.forEach((dialogue: any) => this.dialogues.set(dialogue.id, dialogue));
      }
    } catch (error) {
      console.error("Error loading NPC or Dialogue data:", error);
    }
  }

  createNPC(id: string, name: string, x: number, y: number) {
    const def = this.npcDefinitions.get(id);
    const npc = {
      id,
      name: name || (def ? def.name : "Unknown NPC"),
      role: def ? def.role : "Citizen",
      position: { x, y, z: 0 },
      health: def?.stats?.health || 100,
      maxHealth: def?.stats?.maxHealth || 100,
      stamina: 100,
      inventory: [],
      personality: this.personalityEngine.generateTraits(),
      memory: [],
      dna: this.genealogyEngine.createLineage(id, "Unknown"),
      dialogueId: def ? def.dialogueId : null,
      questHooks: def ? def.questHooks : []
    };
    this.npcs.set(id, npc);
    return npc;
  }

  getNPC(id: string) {
    return this.npcs.get(id);
  }

  handleInteraction(npcId: string, charName: string, playerQuests: any[] = [], questDefinitions: Map<string, any> = new Map(), playerFlags: any = {}) {
    const npc = this.npcs.get(npcId);
    if (!npc) return null;

    const dialogue = this.dialogues.get(npc.dialogueId);
    if (!dialogue) {
      return {
        source: npc.name,
        text: `Hello, I am ${npc.name}. Welcome to Areloria!`,
        questId: null
      };
    }

    // Check if there's a specific node to start with based on quest state
    let startNodeId = "root";
    let text = dialogue.greeting;
    let questId = null;
    let choices = [];

    // Check for quest-specific dialogue (Old Logic)
    if (npc.questHooks && npc.questHooks.length > 0) {
      for (const qId of npc.questHooks) {
        const playerQuest = playerQuests.find(q => q.id === qId);
        if (!playerQuest) {
          const questDef = questDefinitions.get(qId);
          let prereqsMet = true;
          if (questDef && questDef.prerequisiteQuestIds) {
            for (const preId of questDef.prerequisiteQuestIds) {
              const preQuest = playerQuests.find(q => q.id === preId);
              if (!preQuest || !preQuest.completed) {
                prereqsMet = false;
                break;
              }
            }
          }

          if (!prereqsMet) {
            if (dialogue.questPrerequisiteLines && dialogue.questPrerequisiteLines[qId]) {
              text = dialogue.questPrerequisiteLines[qId];
              break;
            }
            continue;
          }

          if (dialogue.questStartLines && dialogue.questStartLines[qId]) {
            text = dialogue.questStartLines[qId];
            questId = qId;
            break;
          }
        } else if (!playerQuest.completed) {
          if (dialogue.questProgressLines && dialogue.questProgressLines[qId]) {
            text = dialogue.questProgressLines[qId];
            break;
          }
        } else {
          if (dialogue.questCompleteLines && dialogue.questCompleteLines[qId]) {
            text = dialogue.questCompleteLines[qId];
            break;
          }
        }
      }
    }

    // New Logic: Branching Nodes
    if (dialogue.nodes) {
      // Determine which node to show
      let activeNodeId = "root";
      
      // If we have quest-specific nodes, we could prioritize them here
      // For now, let's just use "root" as default or check for state-based entry nodes
      if (dialogue.entryNodes) {
        for (const entry of dialogue.entryNodes) {
          let match = true;
          if (entry.conditionFlag && !playerFlags[entry.conditionFlag]) match = false;
          if (entry.conditionQuestId) {
            const q = playerQuests.find(pq => pq.id === entry.conditionQuestId);
            if (entry.conditionQuestState === "completed" && (!q || !q.completed)) match = false;
            if (entry.conditionQuestState === "active" && (!q || q.completed)) match = false;
            if (entry.conditionQuestState === "not_started" && q) match = false;
          }
          if (match) {
            activeNodeId = entry.nodeId;
            break;
          }
        }
      }

      const node = dialogue.nodes[activeNodeId];
      if (node) {
        text = node.text;
        choices = (node.choices || []).filter((c: any) => {
          if (c.conditionFlag && !playerFlags[c.conditionFlag]) return false;
          return true;
        });
      }
    }

    return {
      source: npc.name,
      text,
      questId,
      choices,
      npcId
    };
  }

  handleChoice(npcId: string, nodeId: string, player: any) {
    const npc = this.npcs.get(npcId);
    if (!npc) return null;

    const dialogue = this.dialogues.get(npc.dialogueId);
    if (!dialogue || !dialogue.nodes) return null;

    const node = dialogue.nodes[nodeId];
    if (!node) return null;

    // Apply effects of the choice
    if (node.setFlag) {
      player.flags[node.setFlag] = true;
    }

    let questId = node.triggerQuestId || null;
    let text = node.text;
    let choices = (node.choices || []).filter((c: any) => {
      if (c.conditionFlag && !player.flags[c.conditionFlag]) return false;
      return true;
    });

    return {
      source: npc.name,
      text,
      questId,
      choices,
      npcId
    };
  }

  getAllNPCs() {
    return Array.from(this.npcs.values());
  }

  tick() {
    // Process NPC AI, schedules, needs
  }
}
