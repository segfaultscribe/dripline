import db from "./index.ts";

export function migrate() {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT,
      status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
      created_at INTEGER NOT NULL,
      revoked_at INTEGER
      );
    `);
    console.log("DB migration succesful!");
  } catch (err) {
    console.error("DB migration failed!", err);
    process.exit(1); // hard crash
  }
}

