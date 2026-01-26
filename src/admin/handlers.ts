function createUserHandler({ headers, body, set }) {
  // first we need to check if this is an admin
  const adminKey = headers['x-admin-key'];
  if (!adminKey || adminKey !== Bun.env.ADMIN_KEY) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }

  // parse the body for service
  const {
    externalUserId,
    dailyRequestLimit,
  } = body;

}
