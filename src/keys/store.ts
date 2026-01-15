import db from "../db";
import { generateKey } from "./generate.ts"
import { hashApiKey } from "./hash.ts";
import { randomUUID } from "crypto";

type ApiKeyInput = {
  name?: string;
};

type ApiKeyResult = {
  id: string;
  rawKey: string;
  createdAt: number;
}

export function createApiKeyEntry(
  input: ApiKeyInput = {}
): ApiKeyResult {
  const rawKey = generateKey();
  const hashedKey = hashApiKey(rawKey);

  const id = randomUUID();
  const createdAt = Date.now();

  db.run(
    `
      INSERT INTO api_keys (
        id,
        key_hash,
        name,
        status,
        created_at
      ) VALUES (?, ?, ?, 'active', ?)
    `,
    [id, hashedKey, input.name ?? null, createdAt]
  )
  // NOTE: key_hash is UNIQUE — collision is extremely unlikely,
  // but this may be wrapped in a retry loop in production.


  return {
    id,
    rawKey,
    createdAt,
  }
}
