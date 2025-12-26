import { config } from "./config";
import Elysia from "elysia";
import type { RequestContext } from "./types";
import { executePipeline } from "./pipeline/middleware";
export function startServer() {
  const app = new Elysia()
    .onRequest(({ request }) => {
      const authHeader = request.headers.get("authorization");

      const apiKey = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;

      const ctx: RequestContext = {
        requestId: "1",
        startTime: Date.now(),
        req: request,
        apiKey,
        isTerminated: false,
      }

      return executePipeline(ctx);
    })
    .listen(config.PORT);

  console.log(`Gateway active on port ${app.server?.port}`);
}

