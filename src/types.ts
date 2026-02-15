import type { Context } from "elysia";

// --------------- INTERFACES --------------------
interface RequestContext {
  requestId: string;
  startTime: number;
  req: Request;
  apiKey?: string;
  apiKeyId?: string;
  endUserId?: string;
  isTerminated: boolean;
  isMetered: boolean;
  usageDelta?: number;
  statusCode?: number;
  error?: string;
  rateLimited?: boolean;
  latencyMs?: number;
  upstreamStatus?: number;
}

interface UsageRecord {
  apiKeyId?: string;
  apiKey?: string;
  method: string;
  path: string;
  status: number;
  timestamp: number;
  latencyMs: number;
}

interface endUserCreationSchema {
  external_user_id: string;
  daily_request_limit: number;
}

interface EndUser {
  id: string;
  external_user_id: string;
  status: "active" | "revoked";
  daily_request_limit: number;
  created_at: number;
  revoked_at: number;
}

// --------------- TYPES --------------------
type Middleware = (ctx: RequestContext) => Promise<Response | undefined> | Response | undefined;

type Handler = (ctx: Context) => {}

// --------------- EXPORTS --------------------

// Interfaces
export type {
  RequestContext,
  UsageRecord,
  endUserCreationSchema,
  EndUser
}

// types
export type {
  Middleware,
  Handler
}
