import {
  createEndUser,
  DuplicateExternalUserError,
  UserNotFoundError,
  createUserApiKey,
  revokeUser,
  getUserSummary
} from "./service";

import type { Handler } from '../types.ts';

// const createUserHandler: Handler = ({ headers, body, set }) => {
//   // parse the body for service
//   const {
//     externalUserId,
//     dailyRequestLimit,
//   } = body;
//
//   // call create end user service
//   try {
//     const creationResult = createEndUser(externalUserId, dailyRequestLimit);
//     return { creationResult }
//   } catch (err: unknown) {
//     if (err instanceof DuplicateExternalUserError) {
//       set.status = 409;
//       return {
//         error: err.message,
//       };
//     }
//     console.error('Unexpected error creating API key:', err);
//     set.status = 500;
//     return { error: 'Internal server error' };
//   }
// }

// function createApiKeyHandler({ params: { id }, set, body }) {
//   // verify the user with the id exists
//   const keyName = body.name;
//   try {
//     const keyCreationResult = createUserApiKey(id, keyName);
//     return { keyCreationResult };
//   } catch (err: unknown) {
//     if (err instanceof UserNotFoundError) {
//       set.status = 404;
//       return {
//         error: err.message
//       };
//     }
//     console.error('Unexpected error creating API key:', err);
//     set.status = 500;
//     return { error: 'Internal server error' };
//   }
// }

// function revokeUserHandler({ params: { id }, set }) {
//   try {
//     const revokeResult = revokeUser(id);
//     return { success: true, data: revokeResult };
//   } catch (err: unknown) {
//     if (err instanceof UserNotFoundError) {
//       set.status = 404;
//       return { error: 'User not found' };
//     }
//
//     console.error(`Revoking user failed! ERROR: ${err instanceof Error ? err.message : String(err)}`);
//     set.status = 500;
//     return { error: 'Internal server error' };
//   }
// }

function getUserSummaryHandler({ params: { id }, set }) {
  try {
    const result = getUserSummary(id);
    return result;
  } catch (err: unknown) {
    if (err instanceof UserNotFoundError) {
      set.status = 404;
      return { error: 'User not found' };
    }
    console.error(`Error retrieving user summary: ${err}`);
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

export {
  createUserHandler,
  createApiKeyHandler,
  revokeUserHandler,
  getUserSummaryHandler,
}
