import { Elysia, t } from "elysia";

import {
  createEndUser,
  DuplicateExternalUserError,
  UserNotFoundError,
  createUserApiKey,
  revokeUser,
  getUserSummary,
  getUserUsageSummary,
  getUsageSummary
} from "./service";

import { adminAuth } from "./middlewares/auth";
import { adminRateLimiter } from "./middlewares/rateLimiter";

const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(adminAuth)
  .use(adminRateLimiter)

  .post(
    '/users',
    async ({ body, set }) => {
      const {
        externalUserId,
        dailyRequestLimit,
      } = body;
      try {
        const creationResult = await createEndUser(externalUserId, dailyRequestLimit);
        return creationResult
      } catch (err: unknown) {
        if (err instanceof DuplicateExternalUserError) {
          set.status = 409;
          return {
            error: err.message,
          };
        }
        console.error('Unexpected error creating User:', err);
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      body: t.Object({
        externalUserId: t.String({ minLength: 1 }),
        dailyRequestLimit: t.Number({ minimum: 1 })
      })
    }
  )

  .post(
    '/users/:id/keys',
    async ({ params: { id }, set, body }) => {
      // verify the user with the id exists
      const keyName = body.name;
      try {
        const keyCreationResult = await createUserApiKey(id, keyName);
        return keyCreationResult ;
      } catch (err: unknown) {
        if (err instanceof UserNotFoundError) {
          set.status = 404;
          return {
            error: err.message
          };
        }
        console.error('Unexpected error creating API key:', err);
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    { 
      params: t.Object({
        id: t.String({ minLength: 1 })
      }),
      body: t.Object({
        name: t.String({ minLength: 1 })
      })
    }
  )

  .post(
    '/users/:id/revoke',
    async ({ params: { id }, set }) => {
      try {
        const revokeResult = await revokeUser(id);
        return { success: true, data: revokeResult };
      } catch (err: unknown) {
        if (err instanceof UserNotFoundError) {
          set.status = 404;
          return { error: 'User not found' };
        }
        console.error(`Revoking user failed! ERROR: ${err instanceof Error ? err.message : String(err)}`);
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 })
      })
    }
  )

  .get(
    '/users/:id',
    async ({ params: { id }, set }) => {
      try {
        const result = await getUserSummary(id);
        return result;
      } catch (err: unknown) {
        if (err instanceof UserNotFoundError) {
          set.status = 404;
          return { error: 'User not found' };
        }
        console.error(`Error retrieving user: ${err}`);
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 })
      }),
    }
  )

  .get(
    '/users/:id/usage',
    ({params: {id}, set}) => {
      try{
        const usage = getUserUsageSummary(id);
        return usage;
      } catch (err: unknown) {
        if (err instanceof UserNotFoundError) {
          set.status = 404;
          return { error: 'User not found' };
        }
        console.error(`Error retrieving usage summary: ${err}`);
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 })
      }),
    }
  )

  .get(
    '/usage/summary',
    ({set}) => {
      try{
        const result = getUsageSummary()
        return result;
      } catch(err: unknown) {
        console.error(`Error retrieving usage summary: ${err}`);
        set.status = 500;
        return { error: 'Internal server error' };
      }
    }
  )

export {
  adminRoutes,
}