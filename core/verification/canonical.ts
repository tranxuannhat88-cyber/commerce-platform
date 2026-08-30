/**
 * Deterministic JSON Canonicalization Engine
 * Ensures that identical payloads serialized across different servers / environments
 * produce the EXACT same byte sequence and SHA-256 hash.
 */

export function canonicalizeVerificationPayload(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "boolean" || typeof obj === "number") {
    return JSON.stringify(obj);
  }

  if (typeof obj === "string") {
    // Normalize Unicode to NFC form and strip unneeded trailing whitespace
    return JSON.stringify(obj.normalize("NFC").trim());
  }

  if (Array.isArray(obj)) {
    const serializedItems = obj.map((item) => canonicalizeVerificationPayload(item));
    return `[${serializedItems.join(",")}]`;
  }

  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    // Sort keys alphabetically by ASCII codepoint
    const sortedKeys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort();

    const pairs = sortedKeys.map((key) => {
      const canonicalKey = JSON.stringify(key.normalize("NFC"));
      const canonicalValue = canonicalizeVerificationPayload(record[key]);
      return `${canonicalKey}:${canonicalValue}`;
    });

    return `{${pairs.join(",")}}`;
  }

  return JSON.stringify(obj);
}
