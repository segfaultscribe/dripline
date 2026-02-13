import db from "../db"
import { randomUUID } from "crypto";
import { createApiKeyEntry, getAllAPIKeys, updateAPIKey } from "../keys/store";
import { getCurrentWindowStart } from "../middleware/helpers/window";
import { getTotalUsageToday, getUsageCount } from "../db/usageCounter";
import { getActiveUserCount, getDailyRequestLimit, getTotalUserCount } from "../db/endUsers";

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

interface UserSummary {
  external_user_id: string;
  status: string;
  daily_request_limit: number;
  revoked_at: number;
}

interface UsageDataDuo {
  external_user_id: string;
  daily_request_limit: number;
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
  UPDATE end_users SET status=? WHERE id=? AND status='active'
  `
)

const updateEndUserRevokedAtStmt = db.prepare(
  `
  UPDATE end_users SET revoked_at=? WHERE id=?
  `
)

const getUserInfoStmt = db.prepare<UserSummary, [string]>(
  `
  SELECT external_user_id, daily_request_limit, status, revoked_at FROM end_users WHERE id=?
  `
)

const getExtIdLimitStmt = db.prepare<UsageDataDuo, [string]>(
  `
  SELECT external_user_id, daily_request_limit FROM end_users WHERE id=?
  `
)

async function createEndUser(externalUserId: string, dailyRequestLimit: number) {
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

async function checkUserExists(id: string) {
  const row = checkUserExistsStmt.get(id);
  if (!row) {
    throw new UserNotFoundError(id);
  }
}

async function createUserApiKey(id: string, name: string) {
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

async function revokeUser(id: string) {
  // Throws if user doesn't exist
  await checkUserExists(id);

  // Revoke user
  updateEndUserStatusStmt.run('revoked', id);
  updateEndUserRevokedAtStmt.run(Date.now(), id);

  // Revoke all keys
  const allKeys = getAllAPIKeys(id) as Array<{ keyId: string }>;
  let revokedKeyCount = 0;

  for (const key of allKeys) {
    const { changes } = updateAPIKey(key.keyId, 'revoked');
    if (changes > 0) {
      revokedKeyCount++;
    }
  }

  return {
    userId: id,
    status: 'revoked',
    totalKeys: allKeys.length,
    revokedKeys: revokedKeyCount,
    fullyRevoked: revokedKeyCount === allKeys.length,
  };
}

async function getUserSummary(id: string) {

  // gather info
  const userSummary = getUserInfoStmt.get(id);

  if (!userSummary) {
    throw new UserNotFoundError(id);
  }

  return {
    id,
    ...userSummary
  }
}

async function getUserUsageSummary(userId: string){
  const windowStart = getCurrentWindowStart();

  const usageCount = getUsageCount(userId, windowStart);
  const userData = getExtIdLimitStmt.get(userId);

  if(!userData) {
    throw new UserNotFoundError(userId);
  }

  return {
    id: userId,
    externalUserId: userData.external_user_id,
    usageCount,
    dailyRequestLimit: userData.daily_request_limit,
    remaining: Math.max(0, userData.daily_request_limit - usageCount),
  }
}

async function getUsageSummary(){
  const totalUsers = getTotalUserCount();
  const totalActiveUsers = getActiveUserCount();
  const totalUsageToday = getTotalUsageToday();

  return {
    totalUsers,
    totalActiveUsers,
    totalUsageToday
  }
}

export {
  createEndUser,
  checkUserExists,
  createUserApiKey,
  revokeUser,
  getUserSummary,
  getUserUsageSummary,
  getUsageSummary
}

// errors
export {
  DuplicateExternalUserError,
  UserNotFoundError,
}
