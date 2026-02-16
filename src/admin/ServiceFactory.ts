import type { ApiKeyRepository } from "../db/repositories/apikey";
import type { EndUserRepository, UserSummary } from "../db/repositories/endUsers"
import type { UsageCounterRepository } from "../db/repositories/usageCounter";
import { getCurrentWindowStart } from "../middleware/helpers/window";
import { randomUUID } from "crypto";
import type { ApiKeyService } from "../keys/store";
import type { endUserCreationSchema } from "../types";

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

type AdminDeps = {
    endUserRepo: EndUserRepository;
    apiKeyRepo: ApiKeyRepository;
    usageCounterRepo: UsageCounterRepository
}

// const apiKeyService = ApiKeyService({})
type ApiKeyDeps = {
    apiKeyService: ApiKeyService;
}

type EndUserCreationResult = {
  id: string;
  externalUserId: string;
  dailyRequestLimit: number;
  status: string;
  createdAt: number,
}

interface RevokeUserResult {
    userId: string;
    status: 'revoked';
    totalKeys: number;
    revokedKeys: number;
    fullyRevoked: boolean;
}

interface UserUsageSummary {
    id: string;
    externalUserId: string;
    usageCount: number;
    dailyRequestLimit: number;
    remaining: number;
}

interface UsageSummary {
  totalUsers: number;
  totalActiveUsers: number;
  totalUsageToday: number;
}


export type AdminService = {
  createEndUser(externalUserId: string, dailyRequestLimit: number): EndUserCreationResult;
  createUserApiKey(id: string, name: string): {id: string} | null;
  revokeUser(id: string): RevokeUserResult;
  getUserSummary(id: string): UserSummary & {id: string};
  getUserUsageSummary(userId: string): UserUsageSummary;
  getUsageSummary(): UsageSummary;
}


function createAdminServices(
    {endUserRepo, apiKeyRepo, usageCounterRepo}: AdminDeps,
    {apiKeyService}: ApiKeyDeps
){
    function checkUserExists(id: string){
        const result = endUserRepo.getEndUserById(id);
        if(result === undefined){
            throw new UserNotFoundError(id);
        }
    }
    return {
        createEndUser(externalUserId: string, dailyRequestLimit: number) {
          const id = randomUUID();
          const createdAt = Date.now();
        
          const queryResult = endUserRepo.createEndUser({
            external_user_id: externalUserId,
            daily_request_limit: dailyRequestLimit
          })
          if (queryResult === null) throw new DuplicateExternalUserError(externalUserId);
        
          return {
            id,
            externalUserId,
            dailyRequestLimit,
            status: "active" as const,
            createdAt,
          }
        },

        createUserApiKey(id: string, name: string): {id: string} | null {
            checkUserExists(id);
            //now create the api key
            const apiKeyCreationResult = apiKeyService.createApiKeyEntry({
                name, 
                end_user_id: id
            });
            return apiKeyCreationResult;
        },

        revokeUser(id: string): RevokeUserResult {
            // Throws if user doesn't exist
            checkUserExists(id);
            // Revoke user
            const result = endUserRepo.revokeEndUser(id);
            if(result === null) throw new UserNotFoundError(id);
            // Revoke all keys
            const allKeys = apiKeyRepo.getAllAPIKeys(id);
            let revokedKeyCount = 0;
            // iterate over each key to revoke em'
            for (const key of allKeys) {
                const result = apiKeyRepo.updateAPIKey(key.keyId, 'revoked');
                if (result !== null) {
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
        },

        getUserSummary(id: string): UserSummary & {id: string} {
          const userSummary = endUserRepo.getUserInfo(id);
        
          if (userSummary === null) throw new UserNotFoundError(id);

          return {
            id,
            ...userSummary
          }
        },

        getUserUsageSummary(userId: string): UserUsageSummary {
            const windowStart = getCurrentWindowStart();

            const usageCount = usageCounterRepo.getUsageCount(userId, windowStart);
            const userData = endUserRepo.getExternalUserIdAndDailyLimit(userId);

            if(userData === null) throw new UserNotFoundError(userId);

            return {
                id: userId,
                externalUserId: userData.external_user_id,
                usageCount,
                dailyRequestLimit: userData.daily_request_limit,
                remaining: Math.max(0, userData.daily_request_limit - usageCount),
            }
        },

        getUsageSummary(): UsageSummary {
          const totalUsers = endUserRepo.getTotalUserCount();
          const totalActiveUsers = endUserRepo.getActiveUserCount();
          const totalUsageToday = usageCounterRepo.getTotalUsageToday();
        
          return {
            totalUsers,
            totalActiveUsers,
            totalUsageToday
          }
        }
    }
}

export default createAdminServices;

export {
  DuplicateExternalUserError,
  UserNotFoundError,
}
