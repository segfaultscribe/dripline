import { config } from "./config";
import Elysia from "elysia";
import type { RequestContext } from "./types";

export function startServer() {
  const app = new Elysia()
    .decorate('requestContext', {
      requestID: '',
      startTime: new Date(0),
      isTerminated: false
    } satisfies RequestContext)
    .listen(config.PORT);

  console.log(`Gateway active on port ${app.server?.port}`);
}

