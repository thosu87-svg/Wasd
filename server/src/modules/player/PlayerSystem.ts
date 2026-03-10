export class PlayerSystem {
  private players: Map<string, any> = new Map();

  createPlayer(id: string, name: string) {
    const player = {
      id,
      name,
      position: { x: 0, y: 0, z: 0 },
      health: 100,
      stamina: 100,
      mana: 25,
      skills: {},
      inventory: [],
      faction: null,
      civilization: null,
      matrixEnergy: 0
    };
    this.players.set(id, player);
    return player;
  }

  getPlayer(id: string) {
    return this.players.get(id);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}