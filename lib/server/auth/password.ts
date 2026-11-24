import { ValidationError } from "@/lib/server/errors";
import {
  bytesToHex,
  hexToBytes,
  timingSafeEqualStrings,
} from "@/lib/server/ids";

/**
 * Cloudflare Workers (`workerd`) supports PBKDF2 up to 100,000 iterations natively
 * via Web Crypto (`crypto.subtle`), with zero native binary dependencies.
 */
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

export function validatePasswordStrength(password: string): void {
  if (password.length < 12) {
    throw new ValidationError("Password must be at least 12 characters long.");
  }
  if (password.length > 128) {
    throw new ValidationError("Password must not exceed 128 characters.");
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    throw new ValidationError(
      "Password must include both uppercase and lowercase letters.",
    );
  }
  if (!/[0-9]/.test(password) && !/[^a-zA-Z0-9]/.test(password)) {
    throw new ValidationError(
      "Password must include at least one number or symbol.",
    );
  }
}

async function derivePbkdf2Hex(
  password: string,
  saltBytes: Uint8Array,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<{
  passwordHash: string;
  passwordSalt: string;
}> {
  validatePasswordStrength(password);
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const saltHex = bytesToHex(salt);
  const derived = await derivePbkdf2Hex(password, salt);
  return {
    passwordHash: `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${derived}`,
    passwordSalt: saltHex,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSaltHex: string,
): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    const expectedHex = parts.length === 3 ? parts[2] : storedHash;
    const saltBytes = hexToBytes(storedSaltHex);
    const candidateHex = await derivePbkdf2Hex(password, saltBytes);
    return timingSafeEqualStrings(candidateHex, expectedHex);
  } catch {
    return false;
  }
}
