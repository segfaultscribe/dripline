import { config } from "./config";

export function startServer() {
  const server = Bun.serve({
    port: config.PORT,
    fetch(req) {
      return new Response("API Gateway running", {
        status: 200,
      });
    },
  });

  console.log(`Gateway active on port ${server.port}`);
}

