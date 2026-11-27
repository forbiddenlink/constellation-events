import { Pool } from "pg";
import { createLogger } from "@/lib/logger";

const logger = createLogger("auth-pool");

/**
 * Pool for the auth/session store.
 *
 * pg-pool emits `error` when an idle client's connection dies (Neon closes idle
 * connections, and serverless instances thaw with dead sockets). Without a
 * listener Node rethrows that as an uncaught exception, which is what
 * CONSTELLATION-EVENTS-1 recorded. pg-pool has already removed the dead client by the
 * time it emits, so the next query opens a fresh connection; the only job here is to
 * keep the event from crashing the request. Failures on active queries still reject
 * to the caller and are reported there.
 */
export function createAuthPool(connectionString = process.env.DATABASE_URL): Pool {
  const pool = new Pool({ connectionString });
  pool.on("error", (error) => {
    logger.warn("idle postgres client dropped", { message: error.message });
  });
  return pool;
}
