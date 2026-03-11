import fs from 'fs';
import path from 'path';

function validate() {
  const dataDir = path.resolve(process.cwd(), 'game-data');
  
  const npcs = JSON.parse(fs.readFileSync(path.join(dataDir, 'npc/npcs.json'), 'utf-8'));
  const dialogues = JSON.parse(fs.readFileSync(path.join(dataDir, 'dialogue/dialogues.json'), 'utf-8'));
  const quests = JSON.parse(fs.readFileSync(path.join(dataDir, 'quests/quests.json'), 'utf-8'));
  const spawns = JSON.parse(fs.readFileSync(path.join(dataDir, 'spawns/npc-spawns.json'), 'utf-8'));
  const items = JSON.parse(fs.readFileSync(path.join(dataDir, 'items/items.json'), 'utf-8'));

  const npcIds = new Set(npcs.map((n: any) => n.id));
  const dialogueIds = new Set(dialogues.map((d: any) => d.id));
  const questIds = new Set(quests.map((q: any) => q.id));
  const itemIds = new Set(items.map((i: any) => i.id));

  const errors: string[] = [];

  // NPC -> Dialogue
  npcs.forEach((n: any) => {
    if (!dialogueIds.has(n.dialogueId)) errors.push(`NPC ${n.id} references missing dialogue ${n.dialogueId}`);
  });

  // Quest -> NPC
  quests.forEach((q: any) => {
    if (q.giverNpcId && !npcIds.has(q.giverNpcId)) errors.push(`Quest ${q.id} references missing NPC ${q.giverNpcId}`);
    if (q.reward && q.reward.itemId && !itemIds.has(q.reward.itemId)) errors.push(`Quest ${q.id} references missing item ${q.reward.itemId}`);
    if (q.prerequisiteQuestIds) {
      q.prerequisiteQuestIds.forEach((preId: string) => {
        if (!questIds.has(preId)) errors.push(`Quest ${q.id} references missing prerequisite quest ${preId}`);
      });
    }
  });

  // Spawn -> NPC
  spawns.forEach((region: any) => {
    region.spawns.forEach((s: any) => {
      if (!npcIds.has(s.npcId)) errors.push(`Spawn references missing NPC ${s.npcId}`);
    });
  });

  // Dialogue -> NextNode
  dialogues.forEach((d: any) => {
    if (d.nodes) {
      Object.values(d.nodes).forEach((node: any) => {
        if (node.choices) {
          node.choices.forEach((c: any) => {
            if (c.nextNodeId && !d.nodes[c.nextNodeId]) errors.push(`Dialogue ${d.id} references missing node ${c.nextNodeId}`);
          });
        }
      });
    }
  });

  if (errors.length > 0) {
    console.error('Validation failed:');
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('Validation passed!');
  }
}

validate();
