import { config } from "./config";
import type { RequestContext } from "./types";

function buildUpstremUrl(url: URL){
  return `${config.UPSTREAM_BASE_URL}${url.pathname}${url.search}`;
}

function filterHeaders(headers: Headers): Headers {
  const newHeaders = new Headers();

  for(const [key, value] of headers.entries()){
    const lower = key.toLowerCase();

    if (
      lower === "authorization" ||
      lower === "x-admin-key" ||
      lower === "host"
    ) continue;

    newHeaders.set(key, value);
  }
  return newHeaders;
}

function hasBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

export async function proxyRequest(ctx: RequestContext): Promise<Response> {
  const url = new URL(ctx.req.url);
  const upstreamUrl = buildUpstremUrl(url);

  const signal = AbortSignal.timeout(config.UPSTREAM_TIMEOUT_MS);
  try {
    const upstreamResponse = await fetch(
      upstreamUrl,
      {
        method: ctx.req.method,
        headers: filterHeaders(ctx.req.headers),
        body: hasBody(ctx.req.method) ? ctx.req.body : undefined,
        signal,
      }
    )

    ctx.upstreamStatus = upstreamResponse.status;

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: upstreamResponse.headers,
    });

  } catch (err:unknown) {
    if (signal.aborted) {
      return new Response(
        JSON.stringify({ error: "Upstream timeout" }),
        { status: 504 }
      );
    }
  
    return new Response(
        JSON.stringify({ error: "Upstream request failed" }),
        { status: 502 }
    );
  }
}
