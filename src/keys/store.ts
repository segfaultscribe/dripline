import db from "../db";
import { generateKey } from "./generate.ts"
import { hashApiKey } from "./hash.ts";
import { randomUUID } from "crypto";

const checkAPIKeyExists = db.prepare(
  `
  SELECT 1 FROM api_keys WHERE id=? LIMIT 1
  `
)

const updateAPIKeyStmt = db.prepare(
  `
  UPDATE api_keys SET status=? WHERE end_user_id=?
  `
)

const getAllAPIKeysStmt = db.prepare(
  `
  SELECT id FROM api_keys WHERE end_user_id=?
  `
)

type ApiKeyInput = {
  name?: string;
  end_user_id: string;
};

type ApiKeyResult = {
  id: string;
  end_user_id: string;
  rawKey: string;
  createdAt: number;
}

function createApiKeyEntry(
  input: ApiKeyInput
): ApiKeyResult {
  const rawKey = generateKey();
  const hashedKey = hashApiKey(rawKey);

  const id = randomUUID();
  const end_user_id = input.end_user_id;
  const createdAt = Date.now();

  db.run(
    `
      INSERT INTO api_keys (
        id,
        end_user_id,
        key_hash,
        name,
        status,
        created_at
      ) VALUES (?, ?, ?, 'active', ?)
    `,
    [id, end_user_id, hashedKey, input.name ?? null, createdAt]
  )
  // NOTE: key_hash is UNIQUE — collision is extremely unlikely,
  // but this may be wrapped in a retry loop in production.


  return {
    id,
    end_user_id,
    rawKey,
    createdAt,
  }
}

//NOTE: this function returns only the API Key ids
function getAllAPIKeys(external_user_id: string) {
  // need to retrive all API Keys with external id
  const result = getAllAPIKeysStmt.all(external_user_id);
  return result;
}

function updateAPIKey(id: string, status: string) {
  // update status of API key
  return updateAPIKeyStmt.run(status, id);
}

export {
  createApiKeyEntry,
  getAllAPIKeys,
  updateAPIKey,
}
