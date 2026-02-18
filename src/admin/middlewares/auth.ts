import Elysia from "elysia";

const adminAuth = new Elysia()
  .onBeforeHandle(({ headers, set }) => {
    if (headers['x-admin-key'] !== Bun.env.ADMIN_KEY) {
      set.status = 401;
      return { error: 'Unauthorized in Admin Layer\n' };
    }

  })

export {
  adminAuth,
}
