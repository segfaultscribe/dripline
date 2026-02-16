import type { RequestContext } from "../types";
import { getCurrentWindowStart } from "./helpers/window"; 
import type { UsageCounterRepository } from "../db/repositories/usageCounter";
import type { EndUserRepository } from "../db/repositories/endUsers";

type EnforcementDeps = {
    usageCounterRepo: UsageCounterRepository;
    endUserRepo: EndUserRepository;
}

export function EnforcementMiddleware(
    { usageCounterRepo, endUserRepo } : EnforcementDeps
){ 
    return function usageEnforcement(ctx: RequestContext){
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
        // const usage = getUsageCount(endUserId, windowStart);
        const dailyRequestLimit = endUserRepo.getDailyRequestLimit(endUserId);

        if(dailyRequestLimit === undefined){
            return new Response(
                JSON.stringify({error: "Usage limit not configured"}),
                {status:500, headers: {"Content-Type": "application/json"}}
            );
        }  

        const allowed = usageCounterRepo.tryConsumeUsage(endUserId, windowStart, dailyRequestLimit)
        if(!allowed){
            return new Response(
                JSON.stringify({ error: "Usage limit exceeded"}),
                {status: 429, headers: {"Content-Type": "application/json"}}
            );
        }
        return undefined;
    }
}