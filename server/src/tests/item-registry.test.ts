import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { ItemRegistry } from "../modules/inventory/ItemRegistry.js";

// Mock the 'fs' module
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe("ItemRegistry", () => {
  const mockItems = [
    {
      id: "sword_01",
      name: "Basic Sword",
      type: "weapon",
      slot: "weapon",
      damage: 10,
      rarity: "common",
      description: "A simple iron sword."
    },
    {
      id: "health_potion",
      name: "Health Potion",
      type: "consumable",
      rarity: "common",
      description: "Restores 50 health."
    }
  ];

  beforeEach(() => {
    // Reset the singleton state before each test using reflection
    (ItemRegistry as any).initialized = false;
    (ItemRegistry as any).ITEM_REGISTRY = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("init()", () => {
    it("should load items from items.json if it exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      ItemRegistry.init();

      expect(fs.existsSync).toHaveBeenCalledWith(path.resolve(process.cwd(), "game-data/items/items.json"));
      expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve(process.cwd(), "game-data/items/items.json"), "utf-8");

      const item = ItemRegistry.getItem("sword_01");
      expect(item).toBeDefined();
      expect(item?.name).toBe("Basic Sword");
    });

    it("should not crash if items.json does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(() => ItemRegistry.init()).not.toThrow();
      expect(fs.readFileSync).not.toHaveBeenCalled();

      const item = ItemRegistry.getItem("sword_01");
      expect(item).toBeUndefined();
    });

    it("should catch and log errors if JSON parsing fails", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("invalid json data");

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => ItemRegistry.init()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error loading Item data:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("should only initialize once", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      ItemRegistry.init();
      ItemRegistry.init();

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("getItem()", () => {
    it("should auto-initialize if not already initialized", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      const item = ItemRegistry.getItem("health_potion");

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(item).toBeDefined();
      expect(item?.id).toBe("health_potion");
    });

    it("should return undefined for unknown item IDs", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      const item = ItemRegistry.getItem("unknown_item");

      expect(item).toBeUndefined();
    });
  });

  describe("createInstance()", () => {
    it("should return a new copy of the item definition", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      const instance1 = ItemRegistry.createInstance("sword_01");
      const instance2 = ItemRegistry.createInstance("sword_01");

      expect(instance1).toEqual(instance2);
      expect(instance1).not.toBe(instance2); // Should be different object references

      // Mutating instance1 should not affect instance2 or the registry
      if (instance1) instance1.name = "Modified Sword";

      expect(instance2?.name).toBe("Basic Sword");
      expect(ItemRegistry.getItem("sword_01")?.name).toBe("Basic Sword");
    });

    it("should return null for unknown item IDs", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      const instance = ItemRegistry.createInstance("nonexistent");
      expect(instance).toBeNull();
    });
  });

  describe("hydrate()", () => {
    it("should merge registry definition into an existing item object", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      const rawItem = { id: "sword_01", durability: 50 };
      const hydrated = ItemRegistry.hydrate(rawItem);

      expect(hydrated).toBeDefined();
      expect(hydrated.id).toBe("sword_01");
      expect(hydrated.durability).toBe(50);
      expect(hydrated.name).toBe("Basic Sword");
      expect(hydrated.type).toBe("weapon");
      expect(hydrated.damage).toBe(10);
    });

    it("should return the original item if ID is missing or not found", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockItems));

      const noIdItem = { durability: 50 };
      expect(ItemRegistry.hydrate(noIdItem)).toEqual({ durability: 50 });

      const unknownIdItem = { id: "fake_sword", durability: 50 };
      expect(ItemRegistry.hydrate(unknownIdItem)).toEqual({ id: "fake_sword", durability: 50 });
    });

    it("should return the input if it is falsy", () => {
      expect(ItemRegistry.hydrate(null)).toBeNull();
      expect(ItemRegistry.hydrate(undefined)).toBeUndefined();
    });
  });
});
