import { config } from "./config";
import type { RequestContext } from "./types";

function buildUpstremUrl(url: URL){
  return `${config.UPSTREAM_BASE_URL}${url.pathname}${url.search}`;
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length"
]);

const INTERNAL_HEADERS = new Set([
  "authorization",   // gateway auth
  "x-admin-key"
]);

function filterHeaders(headers: Headers): Headers {
  const newHeaders = new Headers();

  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    if (INTERNAL_HEADERS.has(lower)) continue;

    newHeaders.set(key, value);
  }

  // Optional: identify gateway
  newHeaders.set("x-forwarded-by", "dripline");

  return newHeaders;
}


function hasBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

export async function proxyRequest(ctx: RequestContext): Promise<Response> {
  const url = new URL(ctx.req.url);
  const upstreamUrl = buildUpstremUrl(url);
  console.log(`Upstream URL: ${upstreamUrl}`)

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

    if (upstreamResponse.status >= 500) {
      ctx.upstreamOutcome = "upstream_5xx";
    } else if (upstreamResponse.status >= 400) {
      ctx.upstreamOutcome = "upstream_4xx";
    } else {
      ctx.upstreamOutcome = "success";
    }


    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: upstreamResponse.headers,
    });

  } catch (err: unknown) {
    if(err instanceof Error){
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        ctx.upstreamOutcome = "upstream_timeout"
        return new Response(
          JSON.stringify({ error: "Upstream timeout" }),
          { status: 504 }
        );
      }
    }

    ctx.upstreamOutcome = "upstream_network_error";
  
    return new Response(
        JSON.stringify({ error: "Upstream request failed" }),
        { status: 502 }
    );
  }
}
