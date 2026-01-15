// src/db/apiKeys.ts
import db from "./index.ts";

export type ApiKeyRow = {
  id: string;
  status: 'active' | 'revoked';
};

const getApiKeyByHashStmt = db.query(`
  SELECT id, status
  FROM api_keys
  WHERE key_hash = ?
  LIMIT 1
`);

export function getApiKeyByHash(
  keyHash: string
): ApiKeyRow | undefined {
  return getApiKeyByHashStmt.get(keyHash) as
    | ApiKeyRow
    | undefined;
}

