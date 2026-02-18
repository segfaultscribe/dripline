import type { RequestContext } from "../types";
import { hashApiKey } from "../keys/hash";
import type { ApiKeyRepository } from "../db/repositories/apikey";

type AuthDeps = {
  apiKeyRepo: ApiKeyRepository;
}

export function AuthMiddleware(
  { apiKeyRepo } : AuthDeps
){
  return async function auth(ctx: RequestContext): Promise<Response | undefined> {
    const { requestId, req } = ctx;
    let rawKey: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      rawKey = authHeader.slice(7).trim();
    }
    console.log(`raw key: ${rawKey}`);

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
      const entry = apiKeyRepo.getApiKeyByHash(hash);
      console.log(`hashedKey: ${entry?.id}`)
      if (!entry || entry.status !== "active") {
        console.warn(`[REQ ${requestId}] 401 Unauthorized`);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      //Attach identity
      ctx.apiKeyId = entry.id;
      ctx.endUserId = entry.end_user_id;
      return undefined;
    } catch (err) {
      console.error(`[REQ ${requestId}] Auth failure`, err);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }
}