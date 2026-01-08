import { usage } from './middleware/analytics';

export const handleUsage = async ({ request, headers, query, set }) {
  const adminKey = headers['x-admin-key'];

  if (adminKey !== Bun.env.ADMIN_KEY) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }
  const { apikey, limit = 5 } = query;

  const result = [];
  let c = 0

  for (let i = usage.length - 1; i >= 0; i--) {
    const entry = usage[i];
    if (!entry) continue;
    if (entry.apiKey === apikey) {
      result.push(entry);
      c += 1;
      if (c === limit) break;
    }
  }
  set.status = 200;
  return {
    count: c,
    data: result,
  }

}

