import { Elysia, t } from "elysia";
import { createUserHandler, createApiKeyHandler } from "./handlers";
import { adminAuth } from "./authMiddleware";

const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(adminAuth)
  .post(
    'users',
    createUserHandler,
    {
      body: t.Object({
        externalUserId: t.String({ minLength: 1 }),
        dailyrequestLimit: t.Number({ minimum: 1 })
      })
    })
  .post(
    'users/:id/keys',
    createApiKeyHandler,
  )
  .post(
    '/users/:id/revoke',
    revokeUserHandler,
  )
