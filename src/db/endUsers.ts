import type { endUserCreationSchema, EndUser } from "../types";
import { randomUUID } from "crypto";
import type { Database } from "bun:sqlite";

type EndUserPartial = {
  id: string;
  external_user_id: string;
  status: string,
  daily_request_limit: number,
  revoked_at: number,
}

export type EndUserRepository = {
  createEndUser(input: endUserCreationSchema): { id: string },
  getEndUserById(id: string): EndUserPartial | undefined,
  getEndUserByExternalId(id: string): EndUserPartial | undefined,
  revokeEndUser(id: string): {id: string},
  getDailyRequestLimit(endUserId: string): number | undefined,
  getTotalUserCount(): number,
  getActiveUserCount(): number,
};

function endUserRepository(db: Database){
  const insertEndUser = db.prepare(
    `
      INSERT INTO end_users (
        id,
        external_user_id,
        status,
        daily_request_limit,
        created_at
      ) VALUES (?, ?, ?, ?, ?)
    `
  );

  const retrieveEndUserById = db.prepare(
    `
      SELECT * FROM end_users WHERE id = ?
    `
  );

  const retrieveEndUserByExternalId = db.prepare(
    `
      SELECT * FROM end_users WHERE external_user_id = ?
    `
  );

  const revokeUser = db.prepare(
    `
      UPDATE end_users SET status = 'revoked', revoked_at = ? WHERE id = ? AND status = 'active'
    `
  )

  const getDailyRequestLimitStmt = db.prepare<{ daily_request_limit: number }, [string]>(
    `
    SELECT daily_request_limit from end_users WHERE id=?
    `
  )

  const getUserCountStmt = db.prepare<{count: number}, []>(
    `
    SELECT count(*) AS count FROM end_users
    `
  )

  const getAcitveUsersStmt = db.prepare<{count: number}, []>(
    `
    SELECT count(*) AS count FROM end_users WHERE status='active'
    `
  )

  return {
    createEndUser(input: endUserCreationSchema): { id: string } {
      const { external_user_id, daily_request_limit } = input;
      const now = Date.now();
      const id = randomUUID();
      try {
        insertEndUser.run(
          id,
          external_user_id,
          'active',
          daily_request_limit,
          now,
        )
        return { id }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Failed to create end user:', err.message);
          throw new Error('Could not create end user');
        }
        throw err;
      }
    },

    getEndUserById(id: string): EndUserPartial | undefined {
      try {
        const userRow = retrieveEndUserById.get(id) as EndUser | undefined;
        if (!userRow) return undefined;
        return {
          id,
          external_user_id: userRow.external_user_id,
          status: userRow.status,
          daily_request_limit: userRow.daily_request_limit,
          revoked_at: userRow.revoked_at,
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Failed to retrieve user:', err.message);
          throw new Error('Database error');
        }
        throw err;
      }
    },

    getEndUserByExternalId(id: string): EndUserPartial | undefined {
      try {
        const userRow = retrieveEndUserByExternalId.get(id) as EndUser | undefined;
        if (!userRow) return undefined;
        return {
          id: userRow.id,
          external_user_id: id,
          status: userRow.status,
          daily_request_limit: userRow.daily_request_limit,
          revoked_at: userRow.revoked_at,
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Failed to retrieve user:', err.message);
          throw new Error('Database error');
        }
        throw err;
      }
    },

    revokeEndUser(id: string): {id: string} {
      try {
        revokeUser.run(
          Date.now(),
          id
        )
        return { id }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Failed to revoke end user:', err.message);
          throw new Error('Could not revoke end user');
        }
        throw err;
      }
    },

    getDailyRequestLimit(endUserId: string): number | undefined {
      const row = getDailyRequestLimitStmt.get(endUserId);
      return row?.daily_request_limit ?? undefined
    },

    getTotalUserCount(): number {
      const result = getUserCountStmt.get()
      return result?.count ?? 0;
    },

    getActiveUserCount(): number {
      const result = getAcitveUsersStmt.get()
      return result?.count ?? 0;
    },
  }
}

export {
  endUserRepository
}