import { config } from "./config";
import Elysia from "elysia";
import type { RequestContext } from "./types";
import { executePipeline, use } from "./pipeline/middleware";
import { randomUUID } from "crypto";
import { logger } from "./middleware/logger";
import { AuthMiddleware } from "./middleware/auth";
import { gatewayRateLimiter } from "./middleware/rateLimiter";
import { meter } from "./middleware/metering";
import { EnforcementMiddleware } from "./middleware/enforcement";
import { t } from 'elysia';
import { handleUsage } from "./handlers";
import { migrate } from "./db/migrate";
import { createDatabase } from "./db";
import { createApiKeyRepository } from "./db/repositories/apikey";
import { createEndUserRepository } from "./db/repositories/endUsers";
import { createUsageCounterRepository } from "./db/repositories/usageCounter";
import { createApiKeyService } from "./keys/store";
import createAdminServices from "./admin/ServiceFactory";
import { createAdminRoutes } from "./admin/routes";

const INTERNAL_ROUTES = new Set([
  '/usage',
  '/healthz',
  '/metrics',
  '/admin/users',
  '/admin/users/:id/keys',
  '/admin/users/:id/revoke',
  '/admin/users/:id',
  '/admin/users/:id/usage',
  '/admin/usage/summary'
]);

export function startServer() {
  // COMPOSITE ROOT
  // infra
  const db = createDatabase("data/gateway.db");
  // migrations
  migrate(db);
  // repository init
  const apiKeyRepo = createApiKeyRepository(db);
  const endUserRepo = createEndUserRepository(db);
  const usageCounterRepo = createUsageCounterRepository(db);
  // middleware injection
  const auth = AuthMiddleware({ apiKeyRepo });
  const enforcement = EnforcementMiddleware({ usageCounterRepo, endUserRepo });
  // create service layer 
  const apiKeyService = createApiKeyService({apiKeyRepo});
  const adminService = createAdminServices(
    {endUserRepo, usageCounterRepo, apiKeyRepo},
    {apiKeyService}
  );
  const adminRoutes = createAdminRoutes(adminService);
  // create pipeline
  use(logger);
  use(auth);
  use(gatewayRateLimiter);
  use(meter);
  use(enforcement);
  // SERVER
  const app = new Elysia();
    app.use(adminRoutes);

    app.get(
      '/usage',
      handleUsage,
      {
        query: t.Object({
          apikey: t.String(),
          limit: t.Optional(t.Number({
            minimum: 1,
            maximum: 100,
            default: 5,
          }))
        })
      }
    )

    app.all('*', ({ request }) => {
      const pathname = new URL(request.url).pathname;

      // if (INTERNAL_ROUTES.has(pathname)) {
      //   // Internal route: bypass gateway pipeline
      //   return;
      // }

      const ctx: RequestContext = {
        requestId: randomUUID(), // optimize using monotonic ULID later
        startTime: Date.now(),
        req: request,
        isTerminated: false,
        isMetered: false,
      };
      return executePipeline(ctx);
    })

    

    
    
    .listen(config.PORT)

  console.log(`Gateway active on port ${app.server?.port}`);
}

