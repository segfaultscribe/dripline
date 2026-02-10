import type { RequestContext } from "../types";
import { LIMIT, WINDOW_SEC } from "../constants/policy";

// rateLimitEngine.ts

interface RateValue {
  count: number;
  windowStart: number;
}

const counterMap = new Map<string, RateValue>();

interface CheckRateLimitInput {
  key: string;
  limit: number;
  windowSec: number;
}

export function checkRateLimit({
  key,
  limit,
  windowSec
}: CheckRateLimitInput): boolean {
  const now = Math.floor(Date.now() / 1000);
  const currentWindowStart = now - (now % windowSec);

  const rv = counterMap.get(key);

  if (!rv) {
    counterMap.set(key, {
      count: 1,
      windowStart: currentWindowStart
    });
    return true;
  }

  // new window → reset
  if (rv.windowStart !== currentWindowStart) {
    rv.windowStart = currentWindowStart;
    rv.count = 1;
    return true;
  }

  // same window → check limit
  if (rv.count >= limit) {
    return false;
  }

  rv.count += 1;
  return true;
}


export async function gatewayRateLimiter(ctx: RequestContext) {
  const path = new URL(ctx.req.url).pathname;

  const rateKey = `gateway:${ctx.apiKey}:${ctx.req.method}:${path}`;

  const allowed = checkRateLimit({
    key: rateKey,
    limit: LIMIT,
    windowSec: WINDOW_SEC
  });

  if (!allowed) {
    console.log(
      `[REQ ${ctx.requestId}] 429 Rate limit exceeded for apiKey=${ctx.apiKey} ${ctx.req.method} ${path}`
    );

    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
