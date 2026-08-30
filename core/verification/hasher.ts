/**
 * Cryptographic Hashing Engine (SHA-256)
 * Supports both UTF-8 strings and raw binary ArrayBuffers/Files.
 */

export async function computeSHA256(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof data === "string") {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const copy = new Uint8Array(encoded.byteLength);
    copy.set(encoded);
    buffer = copy.buffer;
  } else if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    buffer = copy.buffer;
  } else {
    buffer = data;
  }

  // Use crypto.subtle (Standard in Web and Node.js)
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hexString;
}

/**
 * Synchronous fallback / Quick hash utility for demo environments
 */
export function quickSyncHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Generate deterministic 64-character pseudo-SHA256 hex string for synchronous operations
  const seed = Math.abs(hash).toString(16).padStart(8, "0");
  return `${seed}a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6${seed}`.slice(0, 64);
}
