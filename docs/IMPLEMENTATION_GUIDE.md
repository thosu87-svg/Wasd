# Implementierungs-Anleitung: Areloria MMORPG Kernkomponenten

## Übersicht

Diese Anleitung beschreibt, wie die erweiterten Kernkomponenten (Skill-System, Loot-System, Brain Field Analyzer) in das bestehende Areloria MMORPG integriert werden.

## 1. Skill-System Integration

### 1.1. Backend-Integration (server/src/modules/skill/)

1. **Ersetzen Sie `SkillSystem.ts`** mit der erweiterten Version (`SkillSystem_Enhanced.ts`)
2. **Aktualisieren Sie die Server-Konfiguration**, um alle Skills zu initialisieren:

```typescript
// server/src/index.ts oder server/src/modules/skill/index.ts
import { SkillSystem } from './SkillSystem';

const skillSystem = new SkillSystem();

// Bei Spieler-Erstellung
function createNewPlayer(playerId: string) {
  const player = {
    id: playerId,
    skills: {}
  };

  // Alle Skills initialisieren
  const skillDefinitions = skillSystem.getAllSkillDefinitions();
  for (const definition of skillDefinitions) {
    skillSystem.ensureSkill(player, definition.id);
  }

  return player;
}
```

3. **Implementieren Sie XP-Quellen** in verschiedenen Gameplay-Systemen:

```typescript
// server/src/modules/combat/CombatSystem.ts
import { SkillSystem } from '../skill/SkillSystem';

export class CombatSystem {
  private skillSystem = new SkillSystem();

  onMonsterDefeated(player: any, monster: any) {
    // Combat Skills XP
    this.skillSystem.addXP(player, 'attack', 25);
    this.skillSystem.addXP(player, 'strength', 20);
    this.skillSystem.addXP(player, 'defence', 15);

    // Loot generieren
    const loot = this.lootGenerator.generateLoot(monster.type, monster.level, player.level);
    player.inventory.push(...loot);
  }
}

// server/src/modules/gathering/GatheringSystem.ts
export class GatheringSystem {
  private skillSystem = new SkillSystem();

  onWoodCut(player: any, treeType: string) {
    const xpAmount = treeType === 'oak' ? 25 : 15;
    this.skillSystem.addXP(player, 'woodcutting', xpAmount);
  }

  onOreGathered(player: any, oreType: string) {
    const xpAmount = oreType === 'mithril' ? 35 : 20;
    this.skillSystem.addXP(player, 'mining', xpAmount);
  }
}

// server/src/modules/crafting/CraftingSystem.ts
export class CraftingSystem {
  private skillSystem = new SkillSystem();

  onItemCrafted(player: any, itemType: string, difficulty: number) {
    const baseXP = 20 * difficulty;
    this.skillSystem.addXP(player, 'crafting', baseXP);
  }
}
```

### 1.2. Frontend-Integration (client/src/)

1. **Erstellen Sie eine Skill-Panel-Komponente**:

```typescript
// client/src/components/SkillPanel.tsx
import React, { useState, useEffect } from 'react';
import { Skill } from '../types/skill';

export const SkillPanel: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('combat');

  useEffect(() => {
    // Skills vom Server abrufen
    fetchPlayerSkills().then(setSkills);
  }, []);

  const filteredSkills = skills.filter(s => s.category === selectedCategory);

  return (
    <div className="skill-panel">
      <h2>Skills</h2>
      <div className="skill-categories">
        {['combat', 'magic', 'crafting', 'gathering', 'support'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? 'active' : ''}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="skill-list">
        {filteredSkills.map(skill => (
          <SkillBar key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
};

const SkillBar: React.FC<{ skill: Skill }> = ({ skill }) => {
  const progress = calculateProgress(skill); // 0.0 bis 1.0

  return (
    <div className="skill-bar">
      <div className="skill-header">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-level">Level {skill.level}</span>
      </div>
      <div className="skill-progress-bar">
        <div className="progress" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="skill-xp">{skill.xp} XP</div>
    </div>
  );
};

function calculateProgress(skill: Skill): number {
  // Berechne Fortschritt zum nächsten Level
  // Dies sollte vom Server kommen
  return 0.5; // Placeholder
}

async function fetchPlayerSkills(): Promise<Skill[]> {
  const response = await fetch('/api/player/skills');
  return response.json();
}
```

2. **Erstellen Sie einen Skill-Tracker für das HUD**:

```typescript
// client/src/components/HUD/SkillTracker.tsx
export const SkillTracker: React.FC = () => {
  const [recentSkillGains, setRecentSkillGains] = useState<Array<{
    skillName: string;
    xpGained: number;
    timestamp: number;
  }>>([]);

  // WebSocket-Listener für Skill-XP-Updates
  useEffect(() => {
    const handleSkillXPGain = (event: CustomEvent) => {
      const { skillName, xpGained } = event.detail;
      setRecentSkillGains(prev => [
        { skillName, xpGained, timestamp: Date.now() },
        ...prev.slice(0, 4) // Nur letzte 5 anzeigen
      ]);

      // Nach 3 Sekunden ausblenden
      setTimeout(() => {
        setRecentSkillGains(prev => prev.slice(1));
      }, 3000);
    };

    window.addEventListener('skillXPGain', handleSkillXPGain as EventListener);
    return () => window.removeEventListener('skillXPGain', handleSkillXPGain as EventListener);
  }, []);

  return (
    <div className="skill-tracker">
      {recentSkillGains.map((gain, idx) => (
        <div key={idx} className="skill-gain-notification">
          +{gain.xpGained} {gain.skillName}
        </div>
      ))}
    </div>
  );
};
```

## 2. Loot-System Integration

### 2.1. Backend-Integration (server/src/modules/loot/)

1. **Erstellen Sie `LootGenerator.ts`** mit der erweiterten Version (`LootGenerator_Enhanced.ts`)

2. **Integrieren Sie mit dem Combat-System**:

```typescript
// server/src/modules/combat/CombatSystem.ts
import { LootGenerator } from '../loot/LootGenerator';

export class CombatSystem {
  private lootGenerator = new LootGenerator();

  onMonsterDefeated(player: any, monster: any) {
    // Loot generieren
    const loot = this.lootGenerator.generateLoot(
      monster.type,
      monster.level,
      player.level
    );

    // Loot an Spieler senden
    player.inventory.push(...loot);

    // Loot-Event an Client senden
    this.broadcastLootDrop(player.id, loot);
  }

  private broadcastLootDrop(playerId: string, loot: any[]) {
    // WebSocket-Nachricht an Client
    const message = {
      type: 'LOOT_DROP',
      playerId,
      items: loot.map(item => ({
        id: item.id,
        name: item.baseItem.name,
        rarity: item.rarity,
        description: item.description
      }))
    };
    // Sende über WebSocket
  }
}
```

3. **Erstellen Sie ein Loot-Drop-System**:

```typescript
// server/src/modules/loot/LootDropSystem.ts
export class LootDropSystem {
  dropLoot(playerId: string, loot: any[], dropPosition: { x: number; y: number }) {
    // Erstelle Loot-Objekte in der Welt
    const droppedLoot = loot.map(item => ({
      id: `loot_${Date.now()}_${Math.random()}`,
      item,
      position: dropPosition,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 Minuten
      owner: playerId
    }));

    // Speichere in Datenbank
    // Benachrichtige Clients in der Nähe
  }
}
```

### 2.2. Frontend-Integration (client/src/)

1. **Erstellen Sie eine Loot-Panel-Komponente**:

```typescript
// client/src/components/LootPanel.tsx
import React, { useState, useEffect } from 'react';
import { GeneratedItem } from '../types/loot';

export const LootPanel: React.FC = () => {
  const [inventory, setInventory] = useState<GeneratedItem[]>([]);

  useEffect(() => {
    // Inventory vom Server abrufen
    fetchPlayerInventory().then(setInventory);
  }, []);

  return (
    <div className="loot-panel">
      <h2>Inventory</h2>
      <div className="inventory-grid">
        {inventory.map(item => (
          <LootItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const LootItem: React.FC<{ item: GeneratedItem }> = ({ item }) => {
  const rarityColor = getRarityColor(item.rarity);

  return (
    <div className={`loot-item rarity-${item.rarity}`} style={{ borderColor: rarityColor }}>
      <div className="item-name">{item.baseItem.name}</div>
      <div className="item-rarity">{item.rarity.toUpperCase()}</div>
      {item.affixes.length > 0 && (
        <div className="item-affixes">
          {item.affixes.map(affix => (
            <div key={affix.id} className="affix">
              {affix.name} +{affix.value.toFixed(1)}
            </div>
          ))}
        </div>
      )}
      <div className="item-level">Item Level: {item.level}</div>
    </div>
  );
};

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#808080',
    uncommon: '#00ff00',
    rare: '#0066ff',
    epic: '#9900ff',
    legendary: '#ffaa00'
  };
  return colors[rarity] || '#ffffff';
}

async function fetchPlayerInventory(): Promise<GeneratedItem[]> {
  const response = await fetch('/api/player/inventory');
  return response.json();
}
```

2. **Erstellen Sie eine Loot-Drop-Visualisierung**:

```typescript
// client/src/components/3D/LootDropVisual.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const LootDropVisual: React.FC<{ item: any; position: { x: number; y: number } }> = ({ item, position }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Erstelle eine kleine 3D-Szene für das Loot-Item
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 100 / 100, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(100, 100);
    containerRef.current.appendChild(renderer.domElement);

    // Erstelle ein einfaches Objekt basierend auf Rarity
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: getRarityColor(item.rarity),
      emissive: getRarityColor(item.rarity),
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 2;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [item]);

  return <div ref={containerRef} className="loot-drop-visual" />;
};

function getRarityColor(rarity: string): number {
  const colors: Record<string, number> = {
    common: 0x808080,
    uncommon: 0x00ff00,
    rare: 0x0066ff,
    epic: 0x9900ff,
    legendary: 0xffaa00
  };
  return colors[rarity] || 0xffffff;
}
```

## 3. Brain Field Analyzer Integration

### 3.1. Backend-Integration (server/src/modules/brain/)

1. **Ersetzen Sie `BrainFieldAnalyzer.ts`** mit der erweiterten Version (`BrainFieldAnalyzer_Enhanced.ts`)

2. **Integrieren Sie mit der HeuristicWorldBrain**:

```typescript
// server/src/modules/brain/HeuristicWorldBrain.ts (erweitert)
import { BrainFieldAnalyzer } from './BrainFieldAnalyzer';

export class HeuristicWorldBrain {
  private fieldAnalyzer = new BrainFieldAnalyzer();

  analyze(context: any) {
    // Bestehende Logik...
    const result = super.analyze(context);

    // Für jeden aktiven Chunk, aktualisiere die Felder
    for (const chunk of context.activeChunks) {
      const fieldAnalysis = this.fieldAnalyzer.analyzeField(chunk.id);
      
      // Nutze die Feldanalyse für emergente Ereignisse
      if (fieldAnalysis.emergentThreats.includes('MONSTER_SURGE')) {
        // Spawne mehr Monster in diesem Chunk
        this.spawnMonsterSurge(chunk);
      }

      if (fieldAnalysis.emergentOpportunities.includes('TRADE_BOOM')) {
        // Erhöhe NPC-Handelsaktivität
        this.increaseNPCTrading(chunk);
      }
    }

    return result;
  }

  private spawnMonsterSurge(chunk: any) {
    // Implementierung
  }

  private increaseNPCTrading(chunk: any) {
    // Implementierung
  }
}
```

### 3.2. Frontend-Integration (client/src/)

1. **Erstellen Sie eine Feldvisualisierung**:

```typescript
// client/src/components/3D/FieldVisualization.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const FieldVisualization: React.FC<{ fieldData: any }> = ({ fieldData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !fieldData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Erstelle eine Heatmap basierend auf Feldwerten
    const gridSize = 10;
    const cellSize = 1;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
        
        // Farbe basierend auf dominantem Feld
        const color = getFieldColor(fieldData.fieldValues);
        const material = new THREE.MeshStandardMaterial({ color });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x * cellSize, y * cellSize, 0);
        scene.add(mesh);
      }
    }

    camera.position.z = 15;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [fieldData]);

  return <div ref={containerRef} className="field-visualization" />;
};

function getFieldColor(fieldValues: Record<string, number>): number {
  if (fieldValues.danger > 0.7) return 0xff0000; // Rot
  if (fieldValues.prosperity > 0.7) return 0x00ff00; // Grün
  if (fieldValues.knowledge > 0.7) return 0x0066ff; // Blau
  if (fieldValues.conflict > 0.7) return 0xff6600; // Orange
  if (fieldValues.harmony > 0.7) return 0x00ff99; // Cyan
  return 0xcccccc; // Grau
}
```

## 4. API-Endpoints

### 4.1. Skill-Endpoints

```typescript
// server/src/api/routes/skills.ts
app.get('/api/player/skills', (req, res) => {
  const player = getPlayerFromSession(req);
  const skills = skillSystem.getAllSkills(player);
  res.json(skills);
});

app.get('/api/player/skills/:skillId', (req, res) => {
  const player = getPlayerFromSession(req);
  const skill = player.skills[req.params.skillId];
  res.json(skill);
});

app.post('/api/player/skills/:skillId/xp', (req, res) => {
  const player = getPlayerFromSession(req);
  const { amount } = req.body;
  const updatedSkill = skillSystem.addXP(player, req.params.skillId, amount);
  res.json(updatedSkill);
});
```

### 4.2. Loot-Endpoints

```typescript
// server/src/api/routes/loot.ts
app.get('/api/player/inventory', (req, res) => {
  const player = getPlayerFromSession(req);
  res.json(player.inventory);
});

app.post('/api/player/inventory/:itemId/equip', (req, res) => {
  const player = getPlayerFromSession(req);
  const item = player.inventory.find(i => i.id === req.params.itemId);
  if (item) {
    player.equipment[item.baseItem.slot] = item;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.delete('/api/player/inventory/:itemId', (req, res) => {
  const player = getPlayerFromSession(req);
  player.inventory = player.inventory.filter(i => i.id !== req.params.itemId);
  res.json({ success: true });
});
```

### 4.3. Field-Endpoints

```typescript
// server/src/api/routes/fields.ts
app.get('/api/world/field/:chunkId', (req, res) => {
  const analysis = fieldAnalyzer.analyzeField(req.params.chunkId);
  res.json(analysis);
});

app.get('/api/world/fields', (req, res) => {
  const fields = fieldAnalyzer.getAllChunkFields();
  res.json(fields);
});
```

## 5. Nächste Schritte

1. **Testen Sie die Skill-Progression** mit verschiedenen XP-Raten
2. **Balancieren Sie die Loot-Chancen** basierend auf Spieler-Feedback
3. **Implementieren Sie visuelle Effekte** für Skill-Level-Ups und Loot-Drops
4. **Erstellen Sie Leaderboards** für Skill-Progression
5. **Implementieren Sie Skill-Quests** und Challenges
6. **Erweitern Sie die Feldgleichungen** mit mehr Interaktionen

Diese Implementierung bietet eine solide Grundlage für ein tiefes und emergentes MMORPG-Erlebnis.
