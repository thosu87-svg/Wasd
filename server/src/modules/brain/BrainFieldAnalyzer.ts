/**
 * Enhanced Brain Field Analyzer für Areloria MMORPG
 * Implementiert die Feldgleichungen und 5-Ebenen-Logik
 * 
 * Das System modelliert die Welt als ein Feld von Einflüssen, die sich über Chunks ausbreiten
 * und emergente Narrative sowie dynamische Gameplay-Mechaniken antreiben
 */

export interface FieldValue {
  value: number; // 0.0 bis 1.0
  lastUpdated: number; // Timestamp
}

export interface ChunkField {
  chunkId: string;
  x: number;
  y: number;
  dangerField: FieldValue;
  prosperityField: FieldValue;
  knowledgeField: FieldValue;
  conflictField: FieldValue;
  harmonyField: FieldValue;
}

export interface FieldAnalysisResult {
  chunkId: string;
  fieldValues: {
    danger: number;
    prosperity: number;
    knowledge: number;
    conflict: number;
    harmony: number;
  };
  dominantField: string;
  fieldIntensity: number; // 0.0 bis 1.0
  emergentThreats: string[];
  emergentOpportunities: string[];
}

export class BrainFieldAnalyzer {
  private chunkFields: Map<string, ChunkField> = new Map();
  private diffusionRate: number = 0.1; // Wie schnell sich Felder ausbreiten
  private decayRate: number = 0.05; // Wie schnell Felder verfallen

  /**
   * Initialisiert ein Feld für einen Chunk
   */
  initializeChunkField(chunkId: string, x: number, y: number): ChunkField {
    const field: ChunkField = {
      chunkId,
      x,
      y,
      dangerField: { value: 0.5, lastUpdated: Date.now() },
      prosperityField: { value: 0.5, lastUpdated: Date.now() },
      knowledgeField: { value: 0.5, lastUpdated: Date.now() },
      conflictField: { value: 0.5, lastUpdated: Date.now() },
      harmonyField: { value: 0.5, lastUpdated: Date.now() }
    };

    this.chunkFields.set(chunkId, field);
    return field;
  }

  /**
   * Aktualisiert die Feldwerte für einen Chunk basierend auf Weltzustand
   */
  updateChunkField(
    chunkId: string,
    context: {
      monsterDensity: number;
      resourceDensity: number;
      playerActivity: number;
      npcDensity: number;
      conflictLevel: number;
      economicActivity: number;
    }
  ): ChunkField {
    let field = this.chunkFields.get(chunkId);
    if (!field) {
      const [x, y] = this.parseChunkId(chunkId);
      field = this.initializeChunkField(chunkId, x, y);
    }

    // Danger Field: Beeinflusst durch Monster und Konflikt
    field.dangerField.value = this.clamp(
      context.monsterDensity * 0.6 + context.conflictLevel * 0.4,
      0,
      1
    );

    // Prosperity Field: Beeinflusst durch Ressourcen und ökonomische Aktivität
    field.prosperityField.value = this.clamp(
      context.resourceDensity * 0.5 + context.economicActivity * 0.5,
      0,
      1
    );

    // Knowledge Field: Beeinflusst durch NPC-Dichte und Spieler-Aktivität
    field.knowledgeField.value = this.clamp(
      context.npcDensity * 0.4 + context.playerActivity * 0.6,
      0,
      1
    );

    // Conflict Field: Direkt vom Konflikt-Level beeinflusst
    field.conflictField.value = this.clamp(context.conflictLevel, 0, 1);

    // Harmony Field: Inverse des Conflict Field
    field.harmonyField.value = 1 - field.conflictField.value;

    // Alle Felder altern (verfallen über Zeit)
    this.applyDecay(field);

    field.dangerField.lastUpdated = Date.now();
    field.prosperityField.lastUpdated = Date.now();
    field.knowledgeField.lastUpdated = Date.now();
    field.conflictField.lastUpdated = Date.now();
    field.harmonyField.lastUpdated = Date.now();

    return field;
  }

  /**
   * Analysiert ein Feld und gibt Ergebnisse mit emergenten Narrativen zurück
   */
  analyzeField(chunkId: string): FieldAnalysisResult {
    const field = this.chunkFields.get(chunkId);
    if (!field) {
      throw new Error(`No field found for chunk: ${chunkId}`);
    }

    const fieldValues = {
      danger: field.dangerField.value,
      prosperity: field.prosperityField.value,
      knowledge: field.knowledgeField.value,
      conflict: field.conflictField.value,
      harmony: field.harmonyField.value
    };

    // Bestimme das dominante Feld
    const dominantField = this.getDominantField(fieldValues);

    // Berechne die Feldintensität (wie "laut" ist das dominante Feld)
    const fieldIntensity = Math.max(...Object.values(fieldValues));

    // Generiere emergente Bedrohungen und Gelegenheiten
    const emergentThreats = this.generateEmergentThreats(fieldValues);
    const emergentOpportunities = this.generateEmergentOpportunities(fieldValues);

    return {
      chunkId,
      fieldValues,
      dominantField,
      fieldIntensity,
      emergentThreats,
      emergentOpportunities
    };
  }

  /**
   * Breitet Feldwerte zu benachbarten Chunks aus (Diffusion)
   */
  diffuseFields(chunkId: string, neighbors: string[]): void {
    const field = this.chunkFields.get(chunkId);
    if (!field) return;

    for (const neighborId of neighbors) {
      let neighborField = this.chunkFields.get(neighborId);
      if (!neighborField) {
        const [x, y] = this.parseChunkId(neighborId);
        neighborField = this.initializeChunkField(neighborId, x, y);
      }

      // Diffusion: Nachbar-Felder nähern sich dem aktuellen Feld an
      neighborField.dangerField.value += (field.dangerField.value - neighborField.dangerField.value) * this.diffusionRate;
      neighborField.prosperityField.value += (field.prosperityField.value - neighborField.prosperityField.value) * this.diffusionRate;
      neighborField.knowledgeField.value += (field.knowledgeField.value - neighborField.knowledgeField.value) * this.diffusionRate;
      neighborField.conflictField.value += (field.conflictField.value - neighborField.conflictField.value) * this.diffusionRate;
      neighborField.harmonyField.value += (field.harmonyField.value - neighborField.harmonyField.value) * this.diffusionRate;

      // Clamp values
      neighborField.dangerField.value = this.clamp(neighborField.dangerField.value, 0, 1);
      neighborField.prosperityField.value = this.clamp(neighborField.prosperityField.value, 0, 1);
      neighborField.knowledgeField.value = this.clamp(neighborField.knowledgeField.value, 0, 1);
      neighborField.conflictField.value = this.clamp(neighborField.conflictField.value, 0, 1);
      neighborField.harmonyField.value = this.clamp(neighborField.harmonyField.value, 0, 1);
    }
  }

  /**
   * Bestimmt das dominante Feld basierend auf Feldwerten
   */
  private getDominantField(fieldValues: Record<string, number>): string {
    let maxValue = 0;
    let dominantField = 'harmony';

    for (const [field, value] of Object.entries(fieldValues)) {
      if (value > maxValue) {
        maxValue = value;
        dominantField = field;
      }
    }

    return dominantField;
  }

  /**
   * Generiert emergente Bedrohungen basierend auf Feldwerten
   */
  private generateEmergentThreats(fieldValues: Record<string, number>): string[] {
    const threats: string[] = [];

    if (fieldValues.danger > 0.7) {
      threats.push('MONSTER_SURGE');
    }

    if (fieldValues.conflict > 0.7) {
      threats.push('CIVIL_UNREST');
      threats.push('NPC_FACTION_WAR');
    }

    if (fieldValues.danger > 0.6 && fieldValues.conflict > 0.6) {
      threats.push('CATASTROPHIC_EVENT');
    }

    if (fieldValues.prosperity < 0.3) {
      threats.push('FAMINE');
      threats.push('ECONOMIC_COLLAPSE');
    }

    if (fieldValues.knowledge < 0.2) {
      threats.push('INFORMATION_VOID');
      threats.push('NPC_AMNESIA');
    }

    return threats;
  }

  /**
   * Generiert emergente Gelegenheiten basierend auf Feldwerten
   */
  private generateEmergentOpportunities(fieldValues: Record<string, number>): string[] {
    const opportunities: string[] = [];

    if (fieldValues.prosperity > 0.7) {
      opportunities.push('TRADE_BOOM');
      opportunities.push('RARE_ITEM_AVAILABILITY');
    }

    if (fieldValues.knowledge > 0.7) {
      opportunities.push('HIDDEN_QUEST_UNLOCK');
      opportunities.push('NPC_KNOWLEDGE_SHARING');
    }

    if (fieldValues.harmony > 0.7) {
      opportunities.push('PEACEFUL_TRADING');
      opportunities.push('NPC_COOPERATION');
    }

    if (fieldValues.danger > 0.6 && fieldValues.prosperity > 0.6) {
      opportunities.push('TREASURE_HUNT');
      opportunities.push('DUNGEON_DISCOVERY');
    }

    if (fieldValues.knowledge > 0.5 && fieldValues.prosperity > 0.5) {
      opportunities.push('CRAFTING_RECIPE_DISCOVERY');
    }

    return opportunities;
  }

  /**
   * Wendet Decay (Verfall) auf Feldwerte an
   */
  private applyDecay(field: ChunkField): void {
    const now = Date.now();
    const timeSinceUpdate = (now - field.dangerField.lastUpdated) / 1000; // in Sekunden

    // Felder verfallen langsam zum Mittelwert (0.5)
    const decayFactor = Math.pow(this.decayRate, timeSinceUpdate);

    field.dangerField.value = field.dangerField.value * decayFactor + 0.5 * (1 - decayFactor);
    field.prosperityField.value = field.prosperityField.value * decayFactor + 0.5 * (1 - decayFactor);
    field.knowledgeField.value = field.knowledgeField.value * decayFactor + 0.5 * (1 - decayFactor);
    field.conflictField.value = field.conflictField.value * decayFactor + 0.5 * (1 - decayFactor);
    field.harmonyField.value = field.harmonyField.value * decayFactor + 0.5 * (1 - decayFactor);
  }

  /**
   * Hilfsfunktion: Clamp-Funktion
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Hilfsfunktion: Parse ChunkId in Koordinaten
   */
  private parseChunkId(chunkId: string): [number, number] {
    const [x, y] = chunkId.split(':').map(Number);
    return [x, y];
  }

  /**
   * Gibt alle Chunk-Felder zurück
   */
  getAllChunkFields(): ChunkField[] {
    return Array.from(this.chunkFields.values());
  }

  /**
   * Gibt ein spezifisches Chunk-Feld zurück
   */
  getChunkField(chunkId: string): ChunkField | undefined {
    return this.chunkFields.get(chunkId);
  }

  /**
   * Setzt die Diffusions-Rate
   */
  setDiffusionRate(rate: number): void {
    this.diffusionRate = this.clamp(rate, 0, 1);
  }

  /**
   * Setzt die Decay-Rate
   */
  setDecayRate(rate: number): void {
    this.decayRate = this.clamp(rate, 0, 1);
  }
}
