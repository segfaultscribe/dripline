import db from "../db"
import { randomUUID } from "crypto";
import { createApiKeyEntry, getAllAPIKeys, updateAPIKey } from "../keys/store";


class DuplicateExternalUserError extends Error {
  constructor(externalUserId: string) {
    super(`External user already exists: ${externalUserId}`);
    this.name = 'DuplicateExternalUserError';
  }
}

class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

const createUserStmt = db.prepare(
  `
    INSERT INTO end_users (
      id,
      external_user_id,
      status,
      daily_request_limit,
      created_at
    )
    VALUES (?, ?, 'active', ?, ?)
    ON CONFLICT(external_user_id) DO NOTHING
  `
)

const checkUserExistsStmt = db.prepare(
  `
  SELECT 1 FROM end_users WHERE id = ? LIMIT 1
  `
)

const updateEndUserStatusStmt = db.prepare(
  `
  UPDATE end_users SET status=? WHERE id=?
  `
)

function createEndUser(externalUserId: string, dailyRequestLimit: number) {
  const id = randomUUID();
  const createdAt = Date.now();

  const queryResult = createUserStmt.run(
    id,
    externalUserId,
    dailyRequestLimit,
    createdAt,
  )
  if (queryResult.changes === 0) throw new DuplicateExternalUserError(externalUserId);

  return {
    id,
    externalUserId,
    dailyRequestLimit,
    status: "active" as const,
    createdAt,
  }
}

function checkUserExists(id: string) {
  const row = checkUserExistsStmt.get(id);
  if (!row) {
    throw new UserNotFoundError(id);
  }
}

function createUserApiKey(id: string, name: string) {
  checkUserExists(id);
  //now create the api key
  try {
    const apiKeyCreationResult = createApiKeyEntry({
      name,
      end_user_id: id,
    });
    return apiKeyCreationResult;
  } catch (err: unknown) {
    console.log("Error in creating api key!");
    throw err;
  }
}

function revokeUser(id: string) {
  checkUserExists(id);
  let revokedKeyCount = 0;
  const revokeResult = updateEndUserStatusStmt.run('revoked', id);

  const allKeys = getAllAPIKeys(id) || [];
  if (allKeys) {
    allKeys.forEach((item) => {
      const { changes } = updateAPIKey('revoked', item.keyId)
      if (changes > 0) {
        revokedKeyCount++;
      }
    })
  }
  return {
    userId: id,
    status: 'revoked',
    TotalAPIKeyCount: allKeys.length,
    RevokedAPIKeyCount: revokedKeyCount,
    fullyRevoked: revokedKeyCount === allKeys.length,
  }
}

// fucntions
export {
  createEndUser,
  checkUserExists,
  createUserApiKey,
}

// errors
export {
  DuplicateExternalUserError,
  UserNotFoundError,
}
