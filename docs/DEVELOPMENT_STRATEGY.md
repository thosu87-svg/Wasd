# Entwicklungsstrategie: Areloria MMORPG

## Übersicht

Das Areloria MMORPG ist ein persistentes Browser-MMORPG mit emergenter Weltlogik, prozeduraler Weltgenerierung und komplexen Spielmechaniken. Die Entwicklung erfolgt mit Three.js (3D-Engine), React/Next.js (Frontend), Node.js/Express (Backend), Firebase (Authentifizierung und Datenbank) und TypeScript.

## 1. Skill-System: Klassenloses RuneScape-ähnliches System ohne Cap

Das Skill-System in Areloria ist klassenloses und basiert auf dem RuneScape-Modell, bei dem Spieler durch das Ausführen von Aktivitäten Erfahrung (XP) in verschiedenen Skills sammeln. Es gibt keine Obergrenze für Skill-Level.

### 1.1. Skill-Struktur

Jeder Skill wird durch folgende Eigenschaften definiert:

```typescript
interface Skill {
  id: string;                    // Eindeutige Skill-ID (z.B. "attack", "magic", "cooking")
  name: string;                  // Anzeigename
  level: number;                 // Aktuelles Level (unbegrenzt)
  xp: number;                    // Aktuelle Erfahrungspunkte
  category: string;              // Kategorie (combat, magic, crafting, gathering)
  description: string;           // Beschreibung
}
```

### 1.2. XP-Berechnung und Level-Progression

Die aktuelle Implementierung in `SkillSystem.ts` verwendet die Formel:

```
nextLevelXP(level) = Math.floor(50 * level^1.4)
```

Diese Formel führt zu exponentieller Progression, was bedeutet, dass höhere Level immer mehr XP erfordern. Dies ist typisch für RuneScape-ähnliche Systeme und verhindert, dass Spieler zu schnell hohe Level erreichen.

**Beispiel-Progression:**
- Level 1 → 2: 50 XP
- Level 10 → 11: ~1.400 XP
- Level 50 → 51: ~200.000 XP
- Level 100 → 101: ~5.000.000 XP

### 1.3. Verfügbare Skills

Basierend auf der Dokumentation sollten folgende Skill-Kategorien implementiert werden:

**Combat Skills:**
- Attack (Nahkampf-Schaden)
- Strength (Kraft und Ausdauer)
- Defence (Rüstung und Schutz)
- Ranged (Fernkampf)
- Magic (Magie)

**Gathering Skills:**
- Woodcutting (Holzfällen)
- Mining (Bergbau)
- Fishing (Fischerei)
- Hunting (Jagd)

**Crafting Skills:**
- Crafting (Herstellung)
- Smithing (Schmiedekunst)
- Cooking (Kochen)
- Alchemy (Alchemie)

**Support Skills:**
- Constitution (Lebensenergie)
- Prayer (Gebete/Segen)
- Herblore (Kräuterkunde)

### 1.4. XP-Quellen und Aktivitäten

Spieler sammeln XP durch verschiedene Aktivitäten:

| Aktivität | Skill | XP-Menge | Bedingung |
| :--- | :--- | :--- | :--- |
| Monster bekämpfen | Attack, Strength, Defence | 10-50 XP | Abhängig von Monster-Stärke |
| Zauber wirken | Magic | 20-100 XP | Abhängig von Zauber-Komplexität |
| Holz fällen | Woodcutting | 5-25 XP | Abhängig von Holztyp |
| Erz abbauen | Mining | 5-25 XP | Abhängig von Erztyp |
| Fischen | Fishing | 5-20 XP | Abhängig von Fischtyp |
| Gegenstände herstellen | Crafting | 10-50 XP | Abhängig von Komplexität |
| Gegenstände schmieden | Smithing | 10-50 XP | Abhängig von Komplexität |
| Essen kochen | Cooking | 5-20 XP | Abhängig von Rezept |

## 2. Loot-System: Diablo-ähnliches System mit Affixen

Das Loot-System in Areloria folgt dem Diablo-Modell, bei dem Items eine Basisqualität haben und durch Affixe (Modifikatoren) erweitert werden. Dies ermöglicht eine große Vielfalt an Items mit unterschiedlichen Eigenschaften.

### 2.1. Item-Struktur

Jedes Item wird durch folgende Eigenschaften definiert:

```typescript
interface Item {
  id: string;                    // Eindeutige Item-ID
  name: string;                  // Anzeigename
  baseItem: string;              // Basis-Item-ID (z.B. "iron_sword")
  type: string;                  // Typ (weapon, armor, misc)
  slot: string;                  // Ausrüstungsplatz (weapon, armor, accessory)
  rarity: string;                // Seltenheit (common, uncommon, rare, epic, legendary)
  baseStats: {                   // Basis-Eigenschaften
    damage?: number;
    armor?: number;
    health?: number;
  };
  affixes: Affix[];              // Angewendete Affixe
  level: number;                 // Item-Level (bestimmt Affix-Stärke)
  description: string;
}

interface Affix {
  id: string;                    // Affix-ID (z.B. "+strength")
  name: string;                  // Anzeigename
  value: number;                 // Wert des Affix (z.B. +5 Strength)
  type: string;                  // Typ (prefix, suffix)
}
```

### 2.2. Rarity-System

Items haben unterschiedliche Seltenheitsstufen, die ihre Qualität und Affix-Anzahl bestimmen:

| Rarity | Farbe | Affixe | Wahrscheinlichkeit | Beispiel |
| :--- | :--- | :--- | :--- | :--- |
| **Common** | Grau | 0 | 60% | Wolf Pelt |
| **Uncommon** | Grün | 1 | 25% | Alpha Claw |
| **Rare** | Blau | 2 | 10% | Relic Fragment |
| **Epic** | Lila | 3 | 4% | Enchanted Blade |
| **Legendary** | Gold | 4 | 1% | Forgotten Sigil |

### 2.3. Affix-Pool

Die verfügbaren Affixe sind in `affix-pool.json` definiert und werden basierend auf dem Item-Typ angewendet:

**Waffen-Affixe:**
- +strength (Stärke)
- +attack_speed (Angriffsgeschwindigkeit)
- +crit_chance (Kritischer Treffer)
- +fire_damage (Feuer-Schaden)
- +cold_damage (Kälte-Schaden)
- +lightning_damage (Blitz-Schaden)

**Rüstungs-Affixe:**
- +health (Lebensenergie)
- +stamina (Ausdauer)
- +resistance (Widerstand)
- +fire_resistance (Feuer-Widerstand)
- +cold_resistance (Kälte-Widerstand)
- +lightning_resistance (Blitz-Widerstand)

### 2.4. Loot-Generierung

Wenn ein Monster besiegt wird, wird das Loot basierend auf der `LootTables`-Struktur generiert:

1. **Loot-Tabelle auswählen**: Basierend auf Monster-Typ (z.B. "wolf", "skeleton")
2. **Items würfeln**: Für jedes Item in der Tabelle wird eine Chance überprüft
3. **Rarity bestimmen**: Basierend auf der Chance des Items
4. **Affixe generieren**: Basierend auf Rarity und Item-Level
5. **Item-Level berechnen**: Basierend auf Monster-Level und Spieler-Level

### 2.5. Item-Level und Affix-Skalierung

Das Item-Level bestimmt die Stärke der Affixe. Höhere Item-Level führen zu stärkeren Affixen:

```
affixValue = baseValue * (1 + itemLevel * 0.05)
```

Beispiel: Ein "+strength"-Affix mit baseValue 5 auf Item-Level 20 würde +5.5 Strength geben.

## 3. Integration mit Feldgleichungen und 5-Ebenen-Logik

Das Skill- und Loot-System sind eng mit den Feldgleichungen und der 5-Ebenen-Logik verbunden:

- **Skill-Progression und Feldgleichungen**: Ein hoher Skill-Level in "Attack" erhöht die `war_momentum` im `HeuristicWorldBrain`, was zu mehr Konflikten und Kriegen in der Welt führt.
- **Loot-Qualität und Feldgleichungen**: In Gebieten mit hohem `PROSPERITY_FIELD` können bessere Items droppen.
- **NPC-Interaktionen und Skill-Level**: NPCs könnten unterschiedlich auf Spieler reagieren, basierend auf deren Skill-Leveln (z.B. ein Waffenhändler könnte bessere Waffen anbieten, wenn der Spieler hohe Combat-Skills hat).

## 4. Implementierungs-Roadmap

### Phase 1: Skill-System Erweiterung
1. Erweitern Sie `SkillSystem.ts` mit allen verfügbaren Skills
2. Implementieren Sie XP-Quellen für verschiedene Aktivitäten
3. Erstellen Sie eine Skill-Anzeige im Frontend (React-Komponente)

### Phase 2: Loot-System Implementierung
1. Erweitern Sie `LootTables.ts` mit mehr Monster-Typen und Items
2. Implementieren Sie eine Loot-Generierungs-Engine
3. Erstellen Sie eine Item-Anzeige im Frontend (React-Komponente)

### Phase 3: Integration und Balancing
1. Integrieren Sie Skill-System und Loot-System mit der Kampf-Engine
2. Balancieren Sie XP-Raten und Loot-Chancen
3. Testen Sie mit echten Spielern

### Phase 4: Erweiterte Funktionen
1. Implementieren Sie Item-Crafting basierend auf Skill-Leveln
2. Implementieren Sie Skill-Quests und Challenges
3. Implementieren Sie Leaderboards für Skills

## 5. Technische Implementierung

### Backend (Node.js/Express/TypeScript)

Die Skill- und Loot-Systeme werden auf dem Server implementiert, um Cheating zu verhindern:

```typescript
// server/src/modules/skill/SkillSystem.ts (erweitert)
export class SkillSystem {
  private skills: Map<string, SkillDefinition> = new Map([
    ['attack', { id: 'attack', name: 'Attack', category: 'combat' }],
    ['magic', { id: 'magic', name: 'Magic', category: 'magic' }],
    // ... weitere Skills
  ]);

  gainXP(player: Player, skillId: string, amount: number): Skill {
    // XP hinzufügen und Level-Up überprüfen
  }

  getSkillLevel(player: Player, skillId: string): number {
    // Aktuelles Skill-Level zurückgeben
  }
}

// server/src/modules/loot/LootGenerator.ts (neu)
export class LootGenerator {
  generateLoot(monsterType: string, monsterLevel: number, playerLevel: number): Item[] {
    // Loot basierend auf Monster-Typ und Level generieren
  }

  rollRarity(baseChance: number): Rarity {
    // Rarity würfeln
  }

  generateAffixes(item: Item, rarity: Rarity, itemLevel: number): Affix[] {
    // Affixe basierend auf Rarity und Item-Level generieren
  }
}
```

### Frontend (React/TypeScript)

Die Skill- und Loot-Systeme werden im Frontend angezeigt und mit dem Server synchronisiert:

```typescript
// client/src/components/SkillPanel.tsx
export const SkillPanel: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    // Skills vom Server abrufen
    fetchPlayerSkills().then(setSkills);
  }, []);

  return (
    <div className="skill-panel">
      {skills.map(skill => (
        <SkillBar key={skill.id} skill={skill} />
      ))}
    </div>
  );
};

// client/src/components/LootPanel.tsx
export const LootPanel: React.FC = () => {
  const [loot, setLoot] = useState<Item[]>([]);

  useEffect(() => {
    // Loot vom Server abrufen
    fetchPlayerLoot().then(setLoot);
  }, []);

  return (
    <div className="loot-panel">
      {loot.map(item => (
        <LootItem key={item.id} item={item} />
      ))}
    </div>
  );
};
```

## 6. Ausblick

Die Implementierung des Skill- und Loot-Systems ist ein kritischer Schritt für das Gameplay-Erlebnis. Die Kombination mit den Feldgleichungen und der 5-Ebenen-Logik wird eine tiefe und emergente Spielwelt schaffen, in der Spieler-Entscheidungen echte Auswirkungen auf die Welt haben.
