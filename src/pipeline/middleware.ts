import type { Middleware, RequestContext } from "../types";

const middlewares: Middleware[] = [];

export function use(mw: Middleware) {
  middlewares.push(mw);
}

export async function executePipeline(ctx: RequestContext): Promise<Response> {
  for (const mw of middlewares) {
    const result = await mw(ctx);

    if (result instanceof Response) {
      ctx.isTerminated = true;

      return result;
    }
  }
  return new Response("Not implemented", { status: 500 });
  // return proxyRequest(ctx);
}
