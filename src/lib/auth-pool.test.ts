import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

import { createAuthPool } from "@/lib/auth-pool";

describe("createAuthPool", () => {
  it("does not throw when an idle client's connection is terminated", async () => {
    const pool = createAuthPool("postgres://u:p@127.0.0.1:1/db");
    // Without an `error` listener EventEmitter throws, i.e. an uncaught exception.
    expect(() =>
      pool.emit("error", new Error("Connection terminated unexpectedly")),
    ).not.toThrow();
    await pool.end();
  });
});
