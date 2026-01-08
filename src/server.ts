import { config } from "./config";
import Elysia from "elysia";
import type { RequestContext } from "./types";
import { executePipeline, use } from "./pipeline/middleware";
import { randomUUID } from "crypto";
import { logger } from "./middleware/logger";
import { auth } from "./middleware/auth";
import { rateLimiter } from "./middleware/rateLimiter";
import { t } from 'elysia';
import { t } from "elysia";
import { handleUsage } from "./handlers";
import { handleUsage } from "./handlers";
import { t } from "elysia";

const INTERNAL_ROUTES = new Set([
  '/usage',
  '/healthz',
  '/metrics',
]);

export function startServer() {
  use(logger);
  use(auth);
  use(rateLimiter);
  const app = new Elysia()
    .onRequest(({ request }) => {
      const pathname = new URL(request.url).pathname;

      if (INTERNAL_ROUTES.has(pathname)) return;

      const ctx: RequestContext = {
        requestId: randomUUID(), // optimize using monotonic ULID later
        startTime: Date.now(),
        req: request,
        isTerminated: false,
      };
      return executePipeline(ctx);
    })
    .listen(config.PORT);

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

  console.log(`Gateway active on port ${app.server?.port}`);
}

