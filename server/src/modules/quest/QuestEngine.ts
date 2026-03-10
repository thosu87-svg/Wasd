import { QuestRegistry } from "./QuestRegistry.js";

export class QuestEngine {
  private active = new Map<string, any[]>();

  startQuest(playerId: string, questId: keyof typeof QuestRegistry) {
    const quest = QuestRegistry[questId];
    if (!quest) return null;
    if (!this.active.has(playerId)) this.active.set(playerId, []);
    this.active.get(playerId)!.push({ ...quest, startedAt: Date.now(), completed: false });
    return quest;
  }

  listQuests(playerId: string) {
    return this.active.get(playerId) || [];
  }

  completeQuest(playerId: string, questId: string) {
    const quests = this.active.get(playerId) || [];
    const q = quests.find((x) => x.id === questId);
    if (!q) return null;
    q.completed = true;
    q.completedAt = Date.now();
    return q.reward;
  }
}