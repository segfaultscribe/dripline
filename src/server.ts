import { config } from "./config";
import Elysia from "elysia";
import type { RequestContext } from "./types";
import { executePipeline, use } from "./pipeline/middleware";
import { randomUUID } from "crypto";
import { logger } from "./middleware/logger";
import { auth } from "./middleware/auth";
import { gatewayRateLimiter } from "./middleware/rateLimiter";
import { meter } from "./middleware/metering";
import { t } from 'elysia';
import { handleUsage } from "./handlers";
import { migrate } from "./db/migrate";

const INTERNAL_ROUTES = new Set([
  '/usage',
  '/healthz',
  '/metrics',
]);

export function startServer() {
  use(logger);
  use(auth);
  use(gatewayRateLimiter);
  use(meter);
  migrate();
  const app = new Elysia()
    .onRequest(({ request }) => {
      const pathname = new URL(request.url).pathname;

      if (INTERNAL_ROUTES.has(pathname)) {
        // Internal route: bypass gateway pipeline
        return;
      }

      const ctx: RequestContext = {
        requestId: randomUUID(), // optimize using monotonic ULID later
        startTime: Date.now(),
        req: request,
        isTerminated: false,
        isMetered: false,
      };
      return executePipeline(ctx);
    })
    .get(
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
    .listen(config.PORT)

  console.log(`Gateway active on port ${app.server?.port}`);
}

