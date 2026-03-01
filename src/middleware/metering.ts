// middleware/meter.ts
import type { RequestContext } from "../types";
import { getConfig } from "../configLoader";

async function meter(ctx: RequestContext) {
    const url = new URL(ctx.req.url);
    const path = url.pathname;
    const method = ctx.req.method; 
    const config = getConfig(); 

    // 1. Fail-safe defaults
    ctx.isMetered = false;
    ctx.usageDelta = 0;

    // 2. Fast routing engine
    for (const route of config.metered_routes) {
        
        // Skip if HTTP method doesn't match
        if (!route.methods.includes(method as any)) {
            continue;
        }

        // Test the path against the pre-compiled Regex
        if (route.matcher.test(path)) {
            ctx.isMetered = true;
            ctx.usageDelta = route.cost_per_request;
            
            // Break early! First matched route wins.
            break; 
        }
    }

    // console.log(`[REQ ${ctx.requestId}] metered=${ctx.isMetered} cost=${ctx.usageDelta} path=${path}`);
    return undefined;
}

export { meter };