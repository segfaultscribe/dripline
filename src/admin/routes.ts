import { Elysia } from "elysia";

const adminRoutes = new Elysia({ prefix: '/admin' })
  .get('users', handleAdminUser)
