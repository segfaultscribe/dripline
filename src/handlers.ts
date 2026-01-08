import { usage } from './middleware/analytics';
import type { Context } from 'elysia';

type UsageQuery = {
  apikey: string;
  limit?: number;
};

export const handleUsage = async ({
  headers,
  query,
  set
}: Context<{
  query: UsageQuery;
}>) => {
  const adminKey = headers['x-admin-key'];

  if (adminKey !== Bun.env.ADMIN_KEY) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }

  const { apikey, limit = 5 } = query;
  const result = [];
  let count = 0;

  for (let i = usage.length - 1; i >= 0 && count < limit; i--) {
    const entry = usage[i];
    if (!entry) continue;

    if (entry.apiKey === apikey) {
      result.push(entry);
      count++;
    }
  }

  set.status = 200;
  return {
    count,
    data: result,
  };
};

