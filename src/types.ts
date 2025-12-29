export interface RequestContext {
  requestId: string;
  startTime: number;
  req: Request;
  apiKey?: string;
  apiKeyId?: string;
  isTerminated: boolean;
  statusCode?: number;
  error?: string;
  rateLimited?: boolean;
  latencyMs?: number;
}

export type Middleware = (ctx: RequestContext) => Promise<Response | void> | Response | void;

export interface UsageRecord {
  apiKeyId?: string;
  method: string;
  path: string;
  status: number;
  timestamp: number;
  latencyMs: number;
}


