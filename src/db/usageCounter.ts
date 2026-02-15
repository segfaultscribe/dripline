import type { Database } from "bun:sqlite";
import { getCurrentWindowStart } from "../middleware/helpers/window";

export type UsageCounterRepository = {
    getUsageCount(endUserId: string, windowStart: number): number;
    tryConsumeUsage(endUserId: string, windowStart: number, limit: number): boolean;
    getTotalUsageToday(): number;

}

function usageCounterRepository(db: Database){
    const getUsageStmt = db.prepare<{count: number}, [string, number]>(`
        SELECT count FROM usage_counters WHERE end_user_id=? AND window_start=?
    `)

    const incrementUsageStmt = db.prepare(`
        INSERT INTO usage_counters (end_user_id, window_start, count) VALUES (?, ?, 1)
        ON CONFLICT(end_user_id, window_start)
        DO UPDATE SET count = count + 1;
    `)

    const totalUsageTodayStmt = db.prepare<{count: number}, [number]>(`
        SELECT count(*) FROM usage_counters where window_start=?
    `)

    return {

        getUsageCount(endUserId: string, windowStart: number): number {
            const result = getUsageStmt.get(endUserId, windowStart);
            return result?.count ?? 0;
        },

        tryConsumeUsage(
            endUserId: string,
            windowStart: number, 
            limit: number,
        ): boolean {

            const tx = db.transaction(() => {
                const row = getUsageStmt.get(endUserId, windowStart);
                const current = row?.count ?? 0;
                
                if(current + 1 > limit) {
                    return false;
                }

                incrementUsageStmt.run(endUserId, windowStart);
                return true;
            });

            return tx();
        },

        getTotalUsageToday(): number {
            const windowStart = getCurrentWindowStart();
            const result = totalUsageTodayStmt.get(windowStart);
            return result?.count ?? 0;
        }
    }
}

// function incrementUsageCount(endUserId: string, windowStart: number){
//     const result = incrementUsageStmt.run(endUserId, windowStart);
//     return result.changes > 0;
// } deprecated

export {
    usageCounterRepository,
}