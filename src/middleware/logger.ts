// logger middleware definition
// output structure: [REQ cc2b55] GET /v1/orders

import type { RequestContext } from "../types";

export async function logger(ctx: RequestContext) {
  const { requestId, req } = ctx;

  const reqId = requestId;
  const method = req.method;
  const path = new URL(req.url).pathname;

  console.log(`[REQ ${reqId}] ${method} ${path}`);
}
