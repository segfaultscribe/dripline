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

export type Middleware = (ctx: RequestContext) => Promise<Response | undefined> | Response | void;

export interface UsageRecord {
  apiKeyId?: string;
  apiKey?: string;
  method: string;
  path: string;
  status: number;
  timestamp: number;
  latencyMs: number;
}


