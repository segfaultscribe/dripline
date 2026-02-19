import type { Middleware, RequestContext } from "../types";
import { proxyRequest } from "../proxy";
import { analytics } from "../middleware/analytics";
import { logRequest } from "../middleware/logger";

const middlewares: Middleware[] = [];

export function use(mw: Middleware) {
  middlewares.push(mw);
}

export async function executePipeline(ctx: RequestContext): Promise<Response | undefined> {
  let res: Response | undefined;

  for (const mw of middlewares) {
    const result = await mw(ctx);

    if (result instanceof Response) {
      ctx.isTerminated = true;
      ctx.upstreamOutcome = "gateway_blocked";
      res = result;
      break;
    }
  }

  if (!res) {
    res = await proxyRequest(ctx);
  }

  // if(ctx.isMetered && ctx.usageDelta && ctx.endUserId){
  //   incrementUsageCount(ctx.endUserId, getCurrentWindowStart())
  // } deprecated: now increment happens BEFORE proxy using transaction

  await analytics(ctx, res);
  logRequest(ctx, res);

  return res;
}
