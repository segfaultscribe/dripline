interface requestContext {
  requestID: string;
  startTime: Date;
  httpMethod: string;
  path: string;
  headers: string[];
  queryParams: string[];
  apiKey?: string;
  apiKeyId?: string;
  isTerminated: boolean;
  statusCode?: number;
  error?: string;
  ratelimited?: boolean;
  latencyMs?: number;
}
