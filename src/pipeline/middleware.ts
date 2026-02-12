import type { Middleware, RequestContext } from "../types";
import { proxyRequest } from "../proxy";
import { analytics } from "../middleware/analytics";
import { incrementUsageCount } from "../db/usageCounter";
import { getCurrentWindowStart } from "../middleware/helpers/window";

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
      res = result;
      break;
    }
  }

  if (!res) {
    res = await proxyRequest(ctx);
  }

  if(ctx.isMetered && ctx.usageDelta && ctx.endUserId){
    incrementUsageCount(ctx.endUserId, getCurrentWindowStart())
  }

  await analytics(ctx, res);

  return res;
}
