/**
 * Enhanced Skill System für Areloria MMORPG
 * Klassenloses RuneScape-ähnliches System ohne Cap
 * 
 * Alle Skills können unbegrenzt leveln mit exponentieller Progression
 */

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  category: 'combat' | 'magic' | 'crafting' | 'gathering' | 'support';
  description: string;
}

export interface PlayerSkills {
  [skillId: string]: Skill;
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: 'combat' | 'magic' | 'crafting' | 'gathering' | 'support';
  description: string;
  baseXPMultiplier: number; // Unterschiedliche Skills geben unterschiedlich viel XP
}

export class SkillSystem {
  private skillDefinitions: Map<string, SkillDefinition> = new Map([
    // Combat Skills
    ['attack', {
      id: 'attack',
      name: 'Attack',
      category: 'combat',
      description: 'Increases your melee damage and accuracy',
      baseXPMultiplier: 1.0
    }],
    ['strength', {
      id: 'strength',
      name: 'Strength',
      category: 'combat',
      description: 'Increases your maximum health and physical damage',
      baseXPMultiplier: 1.0
    }],
    ['defence', {
      id: 'defence',
      name: 'Defence',
      category: 'combat',
      description: 'Increases your armor and damage reduction',
      baseXPMultiplier: 1.0
    }],
    ['ranged', {
      id: 'ranged',
      name: 'Ranged',
      category: 'combat',
      description: 'Increases your ranged damage and accuracy',
      baseXPMultiplier: 1.0
    }],
    
    // Magic Skills
    ['magic', {
      id: 'magic',
      name: 'Magic',
      category: 'magic',
      description: 'Increases your spell damage and mana pool',
      baseXPMultiplier: 1.2
    }],
    
    // Gathering Skills
    ['woodcutting', {
      id: 'woodcutting',
      name: 'Woodcutting',
      category: 'gathering',
      description: 'Allows you to chop trees and gather wood',
      baseXPMultiplier: 0.8
    }],
    ['mining', {
      id: 'mining',
      name: 'Mining',
      category: 'gathering',
      description: 'Allows you to mine ore and gems',
      baseXPMultiplier: 0.8
    }],
    ['fishing', {
      id: 'fishing',
      name: 'Fishing',
      category: 'gathering',
      description: 'Allows you to fish for food and materials',
      baseXPMultiplier: 0.8
    }],
    ['hunting', {
      id: 'hunting',
      name: 'Hunting',
      category: 'gathering',
      description: 'Allows you to hunt animals for food and materials',
      baseXPMultiplier: 0.9
    }],
    
    // Crafting Skills
    ['crafting', {
      id: 'crafting',
      name: 'Crafting',
      category: 'crafting',
      description: 'Allows you to craft items from materials',
      baseXPMultiplier: 1.1
    }],
    ['smithing', {
      id: 'smithing',
      name: 'Smithing',
      category: 'crafting',
      description: 'Allows you to forge metal items',
      baseXPMultiplier: 1.1
    }],
    ['cooking', {
      id: 'cooking',
      name: 'Cooking',
      category: 'crafting',
      description: 'Allows you to cook food',
      baseXPMultiplier: 0.9
    }],
    ['alchemy', {
      id: 'alchemy',
      name: 'Alchemy',
      category: 'crafting',
      description: 'Allows you to brew potions and elixirs',
      baseXPMultiplier: 1.3
    }],
    
    // Support Skills
    ['constitution', {
      id: 'constitution',
      name: 'Constitution',
      category: 'support',
      description: 'Increases your health regeneration',
      baseXPMultiplier: 1.0
    }],
    ['prayer', {
      id: 'prayer',
      name: 'Prayer',
      category: 'support',
      description: 'Allows you to use divine blessings',
      baseXPMultiplier: 1.2
    }],
    ['herblore', {
      id: 'herblore',
      name: 'Herblore',
      category: 'support',
      description: 'Allows you to identify and use herbs',
      baseXPMultiplier: 1.1
    }]
  ]);

  /**
   * Initialisiert einen neuen Skill für einen Spieler
   */
  ensureSkill(player: any, skillId: string): Skill {
    if (!player.skills) {
      player.skills = {};
    }

    if (!player.skills[skillId]) {
      const definition = this.skillDefinitions.get(skillId);
      if (!definition) {
        throw new Error(`Unknown skill: ${skillId}`);
      }

      player.skills[skillId] = {
        id: skillId,
        name: definition.name,
        level: 1,
        xp: 0,
        category: definition.category,
        description: definition.description
      };
    }

    return player.skills[skillId];
  }

  /**
   * Fügt XP zu einem Skill hinzu
   * Berücksichtigt den baseXPMultiplier des Skills
   */
  addXP(player: any, skillId: string, baseAmount: number): Skill {
    const skill = this.ensureSkill(player, skillId);
    const definition = this.skillDefinitions.get(skillId)!;
    
    // XP mit Multiplier anwenden
    const actualXP = baseAmount * definition.baseXPMultiplier;
    skill.xp += actualXP;

    // Level-Ups überprüfen (kann mehrere geben)
    while (skill.xp >= this.nextLevelXP(skill.level)) {
      skill.xp -= this.nextLevelXP(skill.level);
      skill.level += 1;
    }

    return skill;
  }

  /**
   * Berechnet die XP, die für das nächste Level benötigt wird
   * Formel: 50 * level^1.4
   * Dies führt zu exponentieller Progression
   */
  nextLevelXP(level: number): number {
    return Math.floor(50 * Math.pow(level, 1.4));
  }

  /**
   * Berechnet die Gesamte XP, die benötigt wird, um ein bestimmtes Level zu erreichen
   */
  totalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.nextLevelXP(i);
    }
    return total;
  }

  /**
   * Gibt den Fortschritt zum nächsten Level zurück (0.0 bis 1.0)
   */
  getProgressToNextLevel(skill: Skill): number {
    const nextLevelXP = this.nextLevelXP(skill.level);
    return Math.min(1.0, skill.xp / nextLevelXP);
  }

  /**
   * Gibt alle Skills eines Spielers zurück
   */
  getAllSkills(player: any): Skill[] {
    if (!player.skills) {
      player.skills = {};
    }

    // Stelle sicher, dass alle Skills initialisiert sind
    for (const [skillId] of this.skillDefinitions) {
      this.ensureSkill(player, skillId);
    }

    return Object.values(player.skills);
  }

  /**
   * Gibt den durchschnittlichen Skill-Level eines Spielers zurück
   */
  getAverageSkillLevel(player: any): number {
    const skills = this.getAllSkills(player);
    if (skills.length === 0) return 1;
    const sum = skills.reduce((acc, skill) => acc + skill.level, 0);
    return sum / skills.length;
  }

  /**
   * Gibt den höchsten Skill-Level eines Spielers zurück
   */
  getHighestSkillLevel(player: any): number {
    const skills = this.getAllSkills(player);
    if (skills.length === 0) return 1;
    return Math.max(...skills.map(skill => skill.level));
  }

  /**
   * Gibt alle Skills einer bestimmten Kategorie zurück
   */
  getSkillsByCategory(player: any, category: string): Skill[] {
    const skills = this.getAllSkills(player);
    return skills.filter(skill => skill.category === category);
  }

  /**
   * Gibt die Skill-Definition für eine Skill-ID zurück
   */
  getSkillDefinition(skillId: string): SkillDefinition | undefined {
    return this.skillDefinitions.get(skillId);
  }

  /**
   * Gibt alle Skill-Definitionen zurück
   */
  getAllSkillDefinitions(): SkillDefinition[] {
    return Array.from(this.skillDefinitions.values());
  }
}
