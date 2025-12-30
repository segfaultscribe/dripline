import type { RequestContext, UsageRecord } from "../types";

const usage: UsageRecord[] = [];

export async function analytics(ctx: RequestContext, res: Response): Promise<void> {
  const now = Date.now();

  const record: UsageRecord = {
    apiKeyId: ctx.apiKeyId || ctx.apiKey,    // temp fallback
    method: ctx.req.method,
    path: new URL(ctx.req.url).pathname,
    status: res.status,
    timestamp: now,
    latencyMs: now - ctx.startTime
  };

  usage.push(record);

  // TEMP log until dashboard exists
  console.log(
    `[REQ ${ctx.requestId}] Analytics: ${record.method} ${record.path} → ${record.status} (${record.latencyMs}ms)`
  );
}

export { usage }; // needed later for /usage endpoint

