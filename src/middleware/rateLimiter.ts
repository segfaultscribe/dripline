import type { RequestContext } from "../types";
//limit/client = 60 requests 
//window = 60 seconds

interface rateValue {
  count: number;
  windowStart: number;
}

const counterMap = new Map<string, rateValue>();

// rate key format: `rate:<apiKey>:<method>:<path>`
const limit = 60;


export async function rateLimiter(ctx: RequestContext) {

  let limitHit;
  const path = new URL(ctx.req.url).pathname;
  const rateKey = `rate:${ctx.apiKey}:${ctx.req.method}:${path}`
  // gotta find the current window
  const now = Math.floor(Date.now() / 1000);
  const currentWindowStart = now - (now % 60);

  const rv = counterMap.get(rateKey);
  // IF Map entry exists
  if (rv) {
    // check if the current request is in the current window
    if (rv.windowStart == currentWindowStart) {
      limitHit = rv.count >= limit;
    } else {
      // if no update the current window of the request-
      // and allow the request.
      rv.windowStart = currentWindowStart;
      rv.count = 1;
      counterMap.set(rateKey, rv);
    }
    // check limits
    if (limitHit) {
      console.log(`[REQ ${ctx.requestId}] 429 Rate Limit exceeded for key ${ctx.apiKey} on ${ctx.req.method} ${path}`);
      return new Response(
        JSON.stringify({
          error: "Rate Limit exceeded!"
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      );
    } else {
      rv.count += 1;
    }
  } else {
    // we do not have an entry in the Map
    // so we make one lol
    const rv: rateValue = {
      count: 1,
      windowStart: currentWindowStart
    };
    counterMap.set(rateKey, rv);
  }
  console.log("request accepted!");
}

