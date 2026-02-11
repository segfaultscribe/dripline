import type { RequestContext } from "../types";
import { getCurrentWindowStart } from "./helpers/window"; 
import { getUsageCount } from "../db/usageCounter";
import { getDailyRequestLimit } from "../db/endUsers";


function usageEnforcement(ctx: RequestContext){
    const isMetered = ctx.isMetered;
    if(!isMetered) return;
    const endUserId = ctx.endUserId;

    if(!endUserId) {
        return new Response(
            JSON.stringify({ error: "Invalid user identity" }),
            { status: 401 }
        );
    };

    const windowStart = getCurrentWindowStart();
    const usage = getUsageCount(endUserId, windowStart);
    const dailyRequestLimit = getDailyRequestLimit(endUserId);

    if(dailyRequestLimit !== undefined && usage + 1 > dailyRequestLimit){
        return new Response(
            JSON.stringify({error: "Usage limit exceeded"}),
            {status: 429, headers: {"Content-Type": "application/json"}}
        );
    }  

    ctx.usageDelta = 1;
    return undefined;
}