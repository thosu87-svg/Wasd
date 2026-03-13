/**
 * Enhanced Loot Generator für Areloria MMORPG
 * Diablo-ähnliches System mit Affixen und Rarity
 * 
 * Items werden mit zufälligen Affixen generiert, die ihre Eigenschaften modifizieren
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Affix {
  id: string;
  name: string;
  value: number;
  type: 'prefix' | 'suffix';
  stat: string; // z.B. 'strength', 'health', 'fire_damage'
}

export interface BaseItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'misc';
  slot: string;
  baseStats: {
    damage?: number;
    armor?: number;
    health?: number;
    mana?: number;
  };
}

export interface GeneratedItem {
  id: string;
  baseItem: BaseItem;
  rarity: Rarity;
  level: number;
  affixes: Affix[];
  stats: {
    damage?: number;
    armor?: number;
    health?: number;
    mana?: number;
    [key: string]: number | undefined;
  };
  description: string;
}

export interface LootTable {
  [monsterType: string]: {
    items: Array<{
      id: string;
      chance: number;
      rarity: Rarity;
    }>;
  };
}

export class LootGenerator {
  private baseItems: Map<string, BaseItem> = new Map();
  private affixPool: Map<string, Affix[]> = new Map();
  private lootTables: LootTable = {};

  constructor() {
    this.initializeBaseItems();
    this.initializeAffixPool();
    this.initializeLootTables();
  }

  /**
   * Initialisiert die Basis-Items
   */
  private initializeBaseItems(): void {
    const baseItems: BaseItem[] = [
      // Weapons
      {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        slot: 'weapon',
        baseStats: { damage: 25 }
      },
      {
        id: 'wooden_bow',
        name: 'Wooden Bow',
        type: 'weapon',
        slot: 'weapon',
        baseStats: { damage: 20 }
      },
      {
        id: 'staff',
        name: 'Staff',
        type: 'weapon',
        slot: 'weapon',
        baseStats: { damage: 15, mana: 50 }
      },
      // Armor
      {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        slot: 'armor',
        baseStats: { armor: 10, health: 20 }
      },
      {
        id: 'iron_armor',
        name: 'Iron Armor',
        type: 'armor',
        slot: 'armor',
        baseStats: { armor: 20, health: 30 }
      },
      {
        id: 'mithril_armor',
        name: 'Mithril Armor',
        type: 'armor',
        slot: 'armor',
        baseStats: { armor: 30, health: 50 }
      },
      // Accessories
      {
        id: 'ring',
        name: 'Ring',
        type: 'accessory',
        slot: 'ring',
        baseStats: { health: 10 }
      },
      {
        id: 'amulet',
        name: 'Amulet',
        type: 'accessory',
        slot: 'amulet',
        baseStats: { mana: 30 }
      }
    ];

    baseItems.forEach(item => this.baseItems.set(item.id, item));
  }

  /**
   * Initialisiert den Affix-Pool
   */
  private initializeAffixPool(): void {
    const weaponAffixes: Affix[] = [
      { id: 'strength', name: '+Strength', value: 5, type: 'prefix', stat: 'strength' },
      { id: 'attack_speed', name: 'of Swiftness', value: 0.1, type: 'suffix', stat: 'attack_speed' },
      { id: 'crit_chance', name: 'of Precision', value: 0.05, type: 'suffix', stat: 'crit_chance' },
      { id: 'fire_damage', name: 'of Fire', value: 10, type: 'suffix', stat: 'fire_damage' },
      { id: 'cold_damage', name: 'of Frost', value: 10, type: 'suffix', stat: 'cold_damage' },
      { id: 'lightning_damage', name: 'of Thunder', value: 10, type: 'suffix', stat: 'lightning_damage' }
    ];

    const armorAffixes: Affix[] = [
      { id: 'health', name: '+Health', value: 20, type: 'prefix', stat: 'health' },
      { id: 'stamina', name: 'of Endurance', value: 10, type: 'suffix', stat: 'stamina' },
      { id: 'resistance', name: 'of Resistance', value: 0.1, type: 'suffix', stat: 'resistance' },
      { id: 'fire_resistance', name: 'of Fire Resistance', value: 0.15, type: 'suffix', stat: 'fire_resistance' },
      { id: 'cold_resistance', name: 'of Cold Resistance', value: 0.15, type: 'suffix', stat: 'cold_resistance' },
      { id: 'lightning_resistance', name: 'of Lightning Resistance', value: 0.15, type: 'suffix', stat: 'lightning_resistance' }
    ];

    this.affixPool.set('weapon', weaponAffixes);
    this.affixPool.set('armor', armorAffixes);
  }

  /**
   * Initialisiert die Loot-Tabellen
   */
  private initializeLootTables(): void {
    this.lootTables = {
      wolf: {
        items: [
          { id: 'iron_sword', chance: 0.3, rarity: 'common' },
          { id: 'leather_armor', chance: 0.2, rarity: 'common' },
          { id: 'ring', chance: 0.1, rarity: 'uncommon' }
        ]
      },
      skeleton: {
        items: [
          { id: 'iron_sword', chance: 0.25, rarity: 'uncommon' },
          { id: 'iron_armor', chance: 0.2, rarity: 'uncommon' },
          { id: 'amulet', chance: 0.15, rarity: 'rare' }
        ]
      },
      dragon: {
        items: [
          { id: 'mithril_armor', chance: 0.4, rarity: 'rare' },
          { id: 'staff', chance: 0.3, rarity: 'rare' },
          { id: 'ring', chance: 0.2, rarity: 'epic' }
        ]
      }
    };
  }

  /**
   * Generiert Loot für einen besiegten Monster
   */
  generateLoot(
    monsterType: string,
    monsterLevel: number,
    playerLevel: number
  ): GeneratedItem[] {
    const loot: GeneratedItem[] = [];
    const lootTable = this.lootTables[monsterType];

    if (!lootTable) {
      console.warn(`No loot table found for monster type: ${monsterType}`);
      return loot;
    }

    for (const lootEntry of lootTable.items) {
      if (Math.random() < lootEntry.chance) {
        const baseItem = this.baseItems.get(lootEntry.id);
        if (baseItem) {
          const itemLevel = this.calculateItemLevel(monsterLevel, playerLevel);
          const item = this.generateItem(baseItem, lootEntry.rarity, itemLevel);
          loot.push(item);
        }
      }
    }

    return loot;
  }

  /**
   * Generiert ein einzelnes Item mit Affixen
   */
  private generateItem(
    baseItem: BaseItem,
    rarity: Rarity,
    itemLevel: number
  ): GeneratedItem {
    const affixes = this.generateAffixes(baseItem.type, rarity, itemLevel);
    const stats = this.calculateStats(baseItem, affixes, itemLevel);

    return {
      id: `${baseItem.id}_${Date.now()}_${Math.random()}`,
      baseItem,
      rarity,
      level: itemLevel,
      affixes,
      stats,
      description: this.generateDescription(baseItem, affixes, rarity)
    };
  }

  /**
   * Generiert Affixe basierend auf Rarity
   */
  private generateAffixes(
    itemType: string,
    rarity: Rarity,
    itemLevel: number
  ): Affix[] {
    const affixCount = this.getAffixCountForRarity(rarity);
    const availableAffixes = this.affixPool.get(itemType) || [];
    const selectedAffixes: Affix[] = [];

    for (let i = 0; i < affixCount; i++) {
      const randomAffix = availableAffixes[Math.floor(Math.random() * availableAffixes.length)];
      if (randomAffix) {
        // Affix-Wert basierend auf Item-Level skalieren
        const scaledAffix: Affix = {
          ...randomAffix,
          value: randomAffix.value * (1 + itemLevel * 0.05)
        };
        selectedAffixes.push(scaledAffix);
      }
    }

    return selectedAffixes;
  }

  /**
   * Gibt die Anzahl der Affixe basierend auf Rarity zurück
   */
  private getAffixCountForRarity(rarity: Rarity): number {
    switch (rarity) {
      case 'common':
        return 0;
      case 'uncommon':
        return 1;
      case 'rare':
        return 2;
      case 'epic':
        return 3;
      case 'legendary':
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Berechnet die endgültigen Stats eines Items
   */
  private calculateStats(
    baseItem: BaseItem,
    affixes: Affix[],
    itemLevel: number
  ): GeneratedItem['stats'] {
    const stats: GeneratedItem['stats'] = { ...baseItem.baseStats };

    for (const affix of affixes) {
      if (affix.stat === 'strength') {
        stats.damage = (stats.damage || 0) + affix.value;
      } else if (affix.stat === 'health') {
        stats.health = (stats.health || 0) + affix.value;
      } else if (affix.stat === 'stamina') {
        stats.health = (stats.health || 0) + affix.value * 0.5;
      } else if (affix.stat === 'resistance' || affix.stat.includes('resistance')) {
        stats[affix.stat] = (stats[affix.stat] || 0) + affix.value;
      } else {
        stats[affix.stat] = (stats[affix.stat] || 0) + affix.value;
      }
    }

    return stats;
  }

  /**
   * Berechnet das Item-Level basierend auf Monster-Level und Spieler-Level
   */
  private calculateItemLevel(monsterLevel: number, playerLevel: number): number {
    // Item-Level ist durchschnittlich zwischen Monster-Level und Spieler-Level
    const baseLevel = (monsterLevel + playerLevel) / 2;
    // Zufälliger Offset von -5 bis +5
    const offset = Math.floor(Math.random() * 11) - 5;
    return Math.max(1, baseLevel + offset);
  }

  /**
   * Generiert eine Beschreibung für ein Item
   */
  private generateDescription(
    baseItem: BaseItem,
    affixes: Affix[],
    rarity: Rarity
  ): string {
    const rarityText = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    const affixText = affixes.length > 0
      ? ` with ${affixes.map(a => a.name).join(', ')}`
      : '';
    return `${rarityText} ${baseItem.name}${affixText}`;
  }

  /**
   * Gibt die Wahrscheinlichkeit für eine Rarity zurück
   */
  private getRarityChance(rarity: Rarity): number {
    switch (rarity) {
      case 'common':
        return 0.60;
      case 'uncommon':
        return 0.25;
      case 'rare':
        return 0.10;
      case 'epic':
        return 0.04;
      case 'legendary':
        return 0.01;
      default:
        return 0;
    }
  }

  /**
   * Würfelt eine zufällige Rarity basierend auf Chancen
   */
  rollRarity(): Rarity {
    const roll = Math.random();
    let cumulative = 0;

    for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary'] as Rarity[]) {
      cumulative += this.getRarityChance(rarity);
      if (roll < cumulative) {
        return rarity;
      }
    }

    return 'common';
  }
}
