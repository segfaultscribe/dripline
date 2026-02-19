// logger middleware definition
// output structure: [REQ cc2b55] GET /v1/orders

import type { RequestContext } from "../types";

// export async function logger(ctx: RequestContext) {
//   const { requestId, req } = ctx;

//   const reqId = requestId;
//   const method = req.method;
//   const path = new URL(req.url).pathname;

//   console.log(`[REQ ${reqId}] ${method} ${path}`);
//   return undefined;
// }

export function logRequest(ctx: RequestContext, res: Response) {
  const now = Date.now();
  const latencyMs = now - ctx.startTime;
  const level =
  ctx.upstreamOutcome === "success" ? "info" :
  ctx.upstreamOutcome === "gateway_blocked" ? "warn" :
  "error";

  const log = {
    timestamp: new Date(now).toISOString(),
    requestId: ctx.requestId,
    method: ctx.req.method,
    path: new URL(ctx.req.url).pathname,
    endUserId: ctx.endUserId ?? null,
    metered: ctx.isMetered ?? false,
    upstreamOutcome: ctx.upstreamOutcome ?? null,
    upstreamStatus: ctx.upstreamStatus ?? res.status,
    latencyMs,
    level,
  };

  console.log(`[REQ LOG] ${JSON.stringify(log)}`);
}

