import type { Database } from "bun:sqlite";

export function migrate(db: Database) {
  try {
    // NOTE: During early development, schemas are defined via CREATE TABLE.
    // In later phases, changes should be applied via ALTER TABLE migrations

    db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      end_user_id TEXT,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT,
      status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
      created_at INTEGER NOT NULL,
      revoked_at INTEGER
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS end_users (
      id TEXT PRIMARY KEY,
      external_user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
      daily_request_limit INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      revoked_at INTEGER
      );
    `);

    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_end_users_external_id
      ON end_users (external_user_id);
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS usage_counters (
        end_user_id TEXT NOT NULL,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL,
        PRIMARY KEY (end_user_id, window_start) 
      );
    `) // composite key for uniqueness and fast lookup
    console.log("DB migration succesful!");
  } catch (err) {
    console.error("DB migration failed!", err);
    process.exit(1); // hard crash
  }
}

