export class InventorySystem {
  addItem(player: any, item: any) {
    player.inventory.push(item);
    return player.inventory;
  }

  removeItem(player: any, itemId: string) {
    player.inventory = player.inventory.filter((item: any) => item.id !== itemId);
    return player.inventory;
  }
}