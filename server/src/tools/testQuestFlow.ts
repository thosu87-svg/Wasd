import { QuestEngine } from "../modules/quest/QuestEngine.ts";

function log(msg: string) { console.log(msg); }

async function run() {
  const engine = new QuestEngine();
  console.log("loaded quests:", Array.from(engine.getQuestDefinitions().keys()));

  function displayStatus(player: any) {
    const status = engine.getQuestStatus(player);
    console.log("HUD status:");
    status.forEach((q: any) => {
      console.log(` - ${q.title} [${q.state}]`);
      if (q.steps) {
        q.steps.forEach((step: any, idx: number) => {
          const done = idx < q.currentStep || (q.state === 'completed' && idx < q.stepCount);
          const indicator = done ? '✓' : (idx === q.currentStep && q.state === 'active' ? '➤' : '•');
          const desc = step.description || step.type;
          console.log(`   ${indicator} ${desc}`);
        });
      }
    });
  }
  const player: any = { inventory: [], quests: [], gold: 0, xp: 0 };

  log("Starting quest help_test_npc");
  const started = engine.startQuest(player, "help_test_npc");
  console.log("started:", started);
  console.log("player quests:", JSON.stringify(player.quests, null, 2));

  log("-- simulate wrong event (combat dummy) --");
  let res = engine.handleObjectiveEvent(player, { type: "combat", targetId: "npc_dummy" });
  console.log("result:", res);
  console.log("state after wrong event:", JSON.stringify(player.quests, null, 2));

  log("-- simulate talk_to npc_1 (step1) --");
  res = engine.handleObjectiveEvent(player, { type: "talk_to", npcId: "npc_1" });
  console.log("result:", res);
  console.log("state after step1:", JSON.stringify(player.quests, null, 2));

  log("-- simulate adding item and collect (step2) --");
  player.inventory.push({ id: "iron_scrap" });
  res = engine.handleObjectiveEvent(player, { type: "collect", npcId: "npc_1" });
  console.log("result:", res);
  console.log("inventory now:", player.inventory);
  console.log("state after step2:", JSON.stringify(player.quests, null, 2));

  log("-- persistence simulation --");
  const saved = JSON.parse(JSON.stringify(player));
  console.log("saved copy:", JSON.stringify(saved.quests, null, 2));

  log("-- resume and complete step3 (talk again) --");
  res = engine.handleObjectiveEvent(saved, { type: "talk_to", npcId: "npc_1" });
  console.log("result:", res);
  console.log("state after completion:", JSON.stringify(saved.quests, null, 2));
  console.log("player gold/xp:", saved.gold, saved.xp);
}

run().catch(console.error);
