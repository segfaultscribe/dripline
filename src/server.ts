import { config } from "./config";
import Elysia from "elysia";
import type { RequestContext } from "./types";
import { executePipeline, use } from "./pipeline/middleware";
import { randomUUID } from "crypto";
import { logger } from "./middleware/logger";
import { auth } from "./middleware/auth";


export function startServer() {
  use(logger);
  use(auth);
  const app = new Elysia()
    .onRequest(({ request }) => {
      const ctx: RequestContext = {
        requestId: randomUUID(), // optimize using monotonic ULID later
        startTime: Date.now(),
        req: request,
        isTerminated: false,
      };
      return executePipeline(ctx);
    })
    .listen(config.PORT);

  console.log(`Gateway active on port ${app.server?.port}`);
}

