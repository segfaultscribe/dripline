import { randomBytes } from "crypto"
import { API_KEY_ENTROPY_BYTES, API_KEY_PREFIX } from "./constants";

export function generateKey(): string {
  const random = randomBytes(API_KEY_ENTROPY_BYTES)
    .toString("base64url"); //URL Safe

  return `${API_KEY_PREFIX}${random}`;
}


