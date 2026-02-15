// src/db/apiKeys.ts
import db from "./index.ts";
import type { Database } from "bun:sqlite";

export type ApiKeyRow = {
  id: string;
  end_user_id: string;
  status: 'active' | 'revoked';
};

export type ApiKeyRepository = {
  getApiKeyByHash(keyHash: string): ApiKeyRow | undefined;
};

function apiKeyRepository(db: Database): ApiKeyRepository {
  
  const getApiKeyByHashStmt = db.prepare(`
    SELECT id, end_user_id, status
    FROM api_keys
    WHERE key_hash = ?
    LIMIT 1
  `);

  return {
    getApiKeyByHash(
      keyHash: string
    ): ApiKeyRow | undefined {
      return getApiKeyByHashStmt.get(keyHash) as
        | ApiKeyRow
        | undefined;
    },
  }
}



