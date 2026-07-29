/**
 * Password hashing utilities using PBKDF2 + SHA-256 via Web Crypto API.
 * Stores hashes in the format: pbkdf2$<iterations>$<saltHex>$<hashHex>
 *
 * For values not in this format (e.g., the ADMIN_PASSWORD env secret or
 * legacy plain-text values), verifyPassword falls back to plain comparison.
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt.buffer);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH
  );

  const hashHex = toHex(derivedBits);
  return `pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  if (!stored) return false;

  // Hashed value (pbkdf2$iterations$salt$hash format)
  if (stored.startsWith("pbkdf2$")) {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = fromHex(parts[2]);
    const storedHash = parts[3];

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      KEY_LENGTH
    );

    return toHex(derivedBits) === storedHash;
  }

  // Fallback: plain text comparison (env secret or legacy value)
  return password === stored;
}