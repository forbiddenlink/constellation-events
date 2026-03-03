import { describe, it, expect, beforeEach, vi } from "vitest";
import { setCache, getCache, clearCache, getCacheSize } from "./cache";

beforeEach(() => {
  clearCache();
});

describe("setCache / getCache", () => {
  it("stores and retrieves a value", () => {
    setCache("key1", "hello", 10_000);
    expect(getCache("key1")).toBe("hello");
  });

  it("returns null for a missing key", () => {
    expect(getCache("nonexistent")).toBeNull();
  });

  it("returns null after TTL expires", () => {
    vi.useFakeTimers();
    try {
      setCache("ttl-key", 42, 500);
      expect(getCache("ttl-key")).toBe(42);

      vi.advanceTimersByTime(501);
      expect(getCache("ttl-key")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("overwrites an existing key", () => {
    setCache("dup", "first", 10_000);
    setCache("dup", "second", 10_000);
    expect(getCache("dup")).toBe("second");
  });

  it("stores objects by reference", () => {
    const obj = { a: 1 };
    setCache("obj", obj, 10_000);
    expect(getCache("obj")).toBe(obj);
  });
});

describe("getCacheSize", () => {
  it("reports the number of entries", () => {
    expect(getCacheSize()).toBe(0);
    setCache("a", 1, 10_000);
    setCache("b", 2, 10_000);
    expect(getCacheSize()).toBe(2);
  });
});

describe("clearCache", () => {
  it("removes all entries", () => {
    setCache("x", 1, 10_000);
    setCache("y", 2, 10_000);
    clearCache();
    expect(getCacheSize()).toBe(0);
    expect(getCache("x")).toBeNull();
  });
});

describe("LRU eviction", () => {
  it("evicts least recently used entry when cache is full", () => {
    // Fill cache to max size (1000)
    for (let i = 0; i < 1000; i++) {
      setCache(`fill-${i}`, i, 60_000);
    }
    expect(getCacheSize()).toBe(1000);

    // Adding one more should evict the least recently used (fill-0)
    setCache("overflow", "new", 60_000);
    expect(getCacheSize()).toBe(1000);
    expect(getCache("fill-0")).toBeNull();
    expect(getCache("overflow")).toBe("new");
  });
});
