import { Elysia, t } from "elysia";
import {
  createUserHandler,
  createApiKeyHandler,
  revokeUserHandler,
  getUserSummaryHandler,
} from "./handlers";

import {
  createEndUser,
  DuplicateExternalUserError,
  UserNotFoundError,
  createUserApiKey,
  revokeUser,
  getUserSummary
} from "./service";

import { adminAuth } from "./authMiddleware";

const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(adminAuth)
  .post(
    '/users',
    ({ body, set }) => {
      const {
        externalUserId,
        dailyRequestLimit,
      } = body;
      try {
        const creationResult = createEndUser(externalUserId, dailyRequestLimit);
        return { creationResult }
      } catch (err: unknown) {
        if (err instanceof DuplicateExternalUserError) {
          set.status = 409;
          return {
            error: err.message,
          };
        }
        console.error('Unexpected error creating API key:', err);
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
    ({ params: { id }, set, body }) => {
      // verify the user with the id exists
      const keyName = body.name;
      try {
        const keyCreationResult = createUserApiKey(id, keyName);
        return { keyCreationResult };
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
      body: t.Object({
        name: t.String({ minLength: 1 })
      })
    }
  )
  .post(
    '/users/:id/revoke',
    ({ params: { id }, set }) => {
      try {
        const revokeResult = revokeUser(id);
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
    }
  )
  .get(
    '/users/:id',
    getUserSummaryHandler,
  )
