// src/db/apiKeys.ts
import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import type { ApiKeyRow } from "../../types";

export type ApiKeyRowPartial = {
  id: string;
  end_user_id: string;
  status: 'active' | 'revoked';
};

type ApiKeyIdRow = {
  keyId: string;
};

type ApiKeyInput = {
  name?: string;
  id: string;
  end_user_id: string;
  hashedKey: string;
  createdAt: number;
};

type ApiKeyResult = {
  id: string;
  end_user_id: string;
  rawKey: string;
  createdAt: number;
}

export type ApiKeyRepository = {
  getApiKeyByHash(keyHash: string): ApiKeyRowPartial | undefined;
  createApiKeyEntry(input: ApiKeyInput): {id: string} | null;
  getAllAPIKeys(external_user_id: string): ApiKeyIdRow[];
  updateAPIKey(id: string, status: string): {id: string} | null;
};

function createApiKeyRepository(db: Database): ApiKeyRepository {
  
  const getApiKeyByHashStmt = db.prepare(`
    SELECT id, end_user_id, status
    FROM api_keys
    WHERE key_hash = ?
    LIMIT 1
  `);

  const createApiKey = db.prepare(`
    INSERT INTO api_keys (
      id,
      end_user_id,
      key_hash,
      name,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, 'active', ?)
  `);

  const getAllAPIKeysStmt = db.prepare<ApiKeyIdRow, [string]>(`
    SELECT id FROM api_keys WHERE end_user_id=?
  `)
  
  const updateAPIKeyStmt = db.prepare(`
    UPDATE api_keys SET status=? WHERE end_user_id=?
  `)

  return {
    getApiKeyByHash(
      keyHash: string
    ): ApiKeyRowPartial | undefined {
      return getApiKeyByHashStmt.get(keyHash) as
        | ApiKeyRowPartial
        | undefined;
    },

    createApiKeyEntry(
      input: ApiKeyInput
    ): {id: string} | null {
      const result = createApiKey.run(input.id, input.end_user_id, input.hashedKey, input.name ?? null, input.createdAt);
      const id = input.id;
      // NOTE: key_hash is UNIQUE — collision is extremely unlikely,
      // but this may be wrapped in a retry loop in production.
      return result.changes !== 0 ? { id } : null;
    },

    getAllAPIKeys(external_user_id: string): ApiKeyIdRow[] {
      return getAllAPIKeysStmt.all(external_user_id);
    },

    updateAPIKey(id: string, status: string): {id: string} | null {
      const result = updateAPIKeyStmt.run(status, id);
      return result.changes !== 0 ? {id} : null;
    }
  }
}

export {
  createApiKeyRepository,
}



