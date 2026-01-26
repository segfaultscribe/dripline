import db from "../db"
const createUserStmt = db.prepare(
  `
    INSERT INTO end_users (
      id,
      external_user_id,
      status,
      daily_request_limit,
      created_at
    )
    VALUES (?, ?, 'active', ?, ?)
  `
)

function createEndUser(externalUserId: string, dailyRequestLimit: number) {
  // use the prepared query to insert a new row to the table and the first admin route is done.
  // finish other admin routes
}
