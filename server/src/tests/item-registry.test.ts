import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { ItemRegistry } from "../modules/inventory/ItemRegistry.js";

vi.mock("fs", () => {
  return {
    default: {
      existsSync: vi.fn(),
      readFileSync: vi.fn()
    }
  };
});

describe("ItemRegistry Module", () => {
  beforeEach(() => {
    // Reset the internal state
    (ItemRegistry as any).initialized = false;
    (ItemRegistry as any).ITEM_REGISTRY = {};

    // Clear mock histories
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully load items from JSON if file exists", () => {
    const mockItems = [
      {
        id: "test-sword",
        name: "Test Sword",
        type: "weapon",
        slot: "weapon",
        damage: 10,
        rarity: "common",
        description: "A simple sword for testing."
      }
    ];

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

    ItemRegistry.init();

    const item = ItemRegistry.getItem("test-sword");
    expect(item).toEqual(mockItems[0]);
    expect((ItemRegistry as any).initialized).toBe(true);
  });

  it("should not crash if JSON file does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    ItemRegistry.init();

    const item = ItemRegistry.getItem("test-sword");
    expect(item).toBeUndefined();
    expect((ItemRegistry as any).initialized).toBe(true);
  });

  it("should catch and log error if reading JSON file throws an error", () => {
    const errorMsg = "Simulated read error";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error(errorMsg);
    });

    ItemRegistry.init();

    expect(consoleSpy).toHaveBeenCalledWith("Error loading Item data:", expect.any(Error));
    expect(consoleSpy.mock.calls[0][1].message).toBe(errorMsg);
    expect((ItemRegistry as any).initialized).toBe(true);

    consoleSpy.mockRestore();
  });

  it("should return a new instance of an item", () => {
      const mockItems = [
      {
        id: "test-sword-2",
        name: "Test Sword 2",
        type: "weapon",
        slot: "weapon",
        damage: 12,
        rarity: "uncommon",
        description: "A simple sword for testing."
      }
    ];

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

    ItemRegistry.init();

    const instance1 = ItemRegistry.createInstance("test-sword-2");
    const instance2 = ItemRegistry.createInstance("test-sword-2");

    expect(instance1).toEqual(mockItems[0]);
    expect(instance2).toEqual(mockItems[0]);
    expect(instance1).not.toBe(instance2); // Should be different objects
  });

  it("should return null for creating instance of non-existent item", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      ItemRegistry.init();

      const instance = ItemRegistry.createInstance("non-existent");

      expect(instance).toBeNull();
  });

  it("should hydrate an item with definition from registry", () => {
      const mockItems = [
      {
        id: "test-sword-3",
        name: "Test Sword 3",
        type: "weapon",
        slot: "weapon",
        damage: 15,
        rarity: "rare",
        description: "A rare sword."
      }
    ];

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

    ItemRegistry.init();

    const partialItem = { id: "test-sword-3", durability: 100 };
    const hydrated = ItemRegistry.hydrate(partialItem);

    expect(hydrated).toEqual({
        ...partialItem,
        ...mockItems[0]
    });
  });

  it("should return original item if hydration fails due to missing definition", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      ItemRegistry.init();

      const partialItem = { id: "non-existent-sword", durability: 100 };
      const hydrated = ItemRegistry.hydrate(partialItem);

      expect(hydrated).toEqual(partialItem);
  });

  it("should return original item if hydration fails due to missing id", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      ItemRegistry.init();

      const partialItem = { durability: 100 };
      const hydrated = ItemRegistry.hydrate(partialItem);

      expect(hydrated).toEqual(partialItem);
  });

});
