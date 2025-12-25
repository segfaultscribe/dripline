import type { Middleware, RequestContext } from "../types";

const middlewares: Middleware[] = [];

export function registerMid(mw: Middleware) {
  middlewares.push(mw);
}

async function executePipeline(ctx: RequestContext): Promise<Response> {
  for (const mw of middlewares) {
    const result = await mw(ctx);

    if (result instanceof Response) {
      ctx.isTerminated = true;

      return result;
    }
  }

  return;
  // return proxyRequest(ctx);
}
