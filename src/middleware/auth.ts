import type { RequestContext } from "../types"

export async function auth(ctx: RequestContext) {
  const { requestId, req } = ctx;
  let apiKey: string | null = null;

  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      apiKey = authHeader.slice(7).trim();
    }
  }

  if (!apiKey) {
    const apiKeyHeader = req.headers.get("x-api-key");
    if (apiKeyHeader) {
      apiKey = apiKeyHeader.trim();
    }
  }

  if (!apiKey) {
    console.warn(`[REQ ${requestId}] 401 Unauthorized - Missing API Key`);

    return new Response(
      JSON.stringify({
        error: "Missing API Key"
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  ctx.apiKey = apiKey;
}
