import type { RequestContext } from "../types";
import { hashApiKey } from "../keys/hash";
import { getApiKeyByHash } from "../db/apikey";

export async function auth(ctx: RequestContext): Promise<Response | undefined> {
  const { requestId, req } = ctx;
  let rawKey: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    rawKey = authHeader.slice(7).trim();
  }

  if (!rawKey) {
    const apiKeyHeader = req.headers.get("x-api-key");
    if (apiKeyHeader) rawKey = apiKeyHeader.trim();
  }

  if (!rawKey) {
    console.warn(`[REQ ${requestId}] 401 Unauthorized`);
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Hash and db lookup
  try {
    const hash = hashApiKey(rawKey);
    const entry = getApiKeyByHash(hash);

    if (!entry || entry.status !== "active") {
      console.warn(`[REQ ${requestId}] 401 Unauthorized`);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    //Attach identity
    ctx.apiKeyId = entry.id;
    return undefined;
  } catch (err) {
    console.error(`[REQ ${requestId}] Auth failure`, err);
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}
