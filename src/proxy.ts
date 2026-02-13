import { UPSTREAM_BASE_URL } from "./config";
import type { RequestContext } from "./types";

function buildUpstremUrl(path: string){
  return UPSTREAM_BASE_URL + path;
}

export async function proxyRequest(ctx: RequestContext): Promise<Response> {
  const path = new URL(ctx.req.url).pathname;
  const upstreamUrl = buildUpstremUrl(path);

  return new Response("Gateway placeholder response", {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
