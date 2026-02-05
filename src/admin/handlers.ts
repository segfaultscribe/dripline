import { createEndUser, DuplicateExternalUserError, checkUserExists, createUserApiKey } from "./service";

class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

function createUserHandler({ headers, body, set }) {
  // parse the body for service
  const {
    externalUserId,
    dailyRequestLimit,
  } = body;

  // call create end user service
  try {
    const creationResult = createEndUser(externalUserId, dailyRequestLimit);
    return { creationResult }
  } catch (err: unknown) {
    if (err instanceof DuplicateExternalUserError) {
      set.status = 409;
      return {
        error: err.message,
      };
    }
    console.error('Unexpected error creating API key:', err);
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

function createApiKeyHandler({ params: { id }, set, body }) {
  // verify the user with the id exists
  const keyName = body.name;
  try {
    const keyCreationResult = createUserApiKey(id, keyName);
    return { keyCreationResult };
  } catch (err: unknown) {
    if (err instanceof UserNotFoundError) {
      set.status = 404;
      return {
        error: err.message
      };
    }
    console.error('Unexpected error creating API key:', err);
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

function revokeUserHandler({ params: { id }, set, body }) {
  // revoke the user and all their API Keys haha
  // PIPELINE: identify user -> revoke user
  const revokeResult = revokeUser(id);

}

export {
  createUserHandler,
  createApiKeyHandler,
}
