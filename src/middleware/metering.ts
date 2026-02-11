import type { RequestContext } from "../types";
import { METERED_PATH_PREFIXES } from "../config";

async function meter(ctx: RequestContext){
    const path = new URL(ctx.req.url).pathname;

    const isMetered = METERED_PATH_PREFIXES.some(prefix => 
        path.startsWith(prefix)
    );

    ctx.isMetered = isMetered;

    console.log(`[REQ ${ctx.requestId}] metered=${isMetered} path=${path}`);
    return undefined;
}

export {
    meter,
}