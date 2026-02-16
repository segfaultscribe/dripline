import type { ApiKeyRepository } from "../db/repositories/apikey.ts";
import { generateKey } from "./generate.ts"
import { hashApiKey } from "./hash.ts";
import { randomUUID } from "crypto";
import type { ApiKeyRow } from "../types.ts";

// const checkAPIKeyExists = db.prepare(
//   `
//   SELECT 1 FROM api_keys WHERE id=? LIMIT 1
//   `
// )


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

type ApiKeyDeps = {
  apiKeyRepo: ApiKeyRepository
}

export type ApiKeyService = {
  createApiKeyEntry(input: ApiKeyInput): ApiKeyResult;
}

export function createApiKeyService(
  { apiKeyRepo }: ApiKeyDeps
){
  return {
    createApiKeyEntry(
      input: ApiKeyInput
    ): ApiKeyResult {
      const rawKey = generateKey();
      const hashedKey = hashApiKey(rawKey);
      const name = input.name || undefined;
      const id = randomUUID();
      const end_user_id = input.end_user_id;
      const createdAt = Date.now();
      const result = apiKeyRepo.createApiKeyEntry({id, end_user_id, hashedKey, name, createdAt})
      // NOTE: key_hash is UNIQUE — collision is extremely unlikely,
      // but this may be wrapped in a retry loop in production.
      return {
        id,
        end_user_id,
        rawKey,
        createdAt,
      }
    }
  }
}