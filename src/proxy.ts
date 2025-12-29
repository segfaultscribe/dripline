import type { RequestContext } from "./types";

export async function proxyRequest(ctx: RequestContext): Promise<Response> {
  // a temporary implementation until upstream support is added.

  return new Response("Gateway placeholder response", {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
