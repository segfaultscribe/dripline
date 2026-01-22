// TODO IMPLEMENT
// createEndUser(input) ✔
// getEndUserById(id)
// getEndUserByExternalId(id)
// revokeEndUser(id)
import type { endUserCreationSchema, EndUser } from "../types";
import db from ".";
import { randomUUID } from "crypto";

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
    UPDATE end_users SET status = ?, revoked_at = ? WHERE id = ?
  `
)

function createEndUser(input: endUserCreationSchema): { id: string } {
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
}

function getEndUserById(id: string) {
  try {
    const userRow = retrieveEndUserById.get(id) as EndUser | undefined;
    if (!userRow) return null;
    return {
      id,
      external_user_id: userRow.external_user_id,
      status: userRow.status,
      daily_request_limit: userRow.daily_request_limit,
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Failed to retrieve user:', err.message);
      throw new Error('Database error');
    }
    throw err;
  }
}

function getEndUserByExternalId(id: string) {
  try {
    const userRow = retrieveEndUserByExternalId.get(id) as EndUser | undefined;
    if (!userRow) return null;
    return {
      id: userRow.id,
      external_user_id: id,
      status: userRow.status,
      daily_request_limit: userRow.daily_request_limit,
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Failed to retrieve user:', err.message);
      throw new Error('Database error');
    }
    throw err;
  }
}

function revokeEndUser(id: string) {

}

export {
  createEndUser,
  getEndUserById,
  getEndUserByExternalId,

}
