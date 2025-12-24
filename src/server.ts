import { config } from "./config";
import Elysia from "elysia";

export function startServer() {
  const app = new Elysia()
    .listen(config.PORT);

  console.log(`Gateway active on port ${app.server?.port}`);
}


