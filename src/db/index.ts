import { Database } from "bun:sqlite";

const db = new Database("data/gateway.db");

db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");
db.run("PRAGMA busy_timeout = 5000");

export default db;
