import Elysia from "elysia";
import { checkRateLimit } from "../../middleware/rateLimiter";
import { ADMIN_GLOBAL_RATE_KEY, ADMIN_RATE_LIMIT, ADMIN_WINDOW_SEC } from "../../constants/policy";

const adminRateLimiter = new Elysia()
  .onBeforeHandle(({ set }) => {
    const allowed = checkRateLimit({
      key: ADMIN_GLOBAL_RATE_KEY,
      limit: ADMIN_RATE_LIMIT,
      windowSec: ADMIN_WINDOW_SEC
    });

    if (!allowed) {
      set.status = 429;
      return { error: "Admin rate limit exceeded\n" };
    }
  });

export {
    adminRateLimiter,
}