/**
 * Token encryption utilities using AES-256-GCM
 * Story 4.1: Facebook Page Connection Flow
 *
 * Format: iv:authTag:ciphertext (all hex-encoded)
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt a token using AES-256-GCM with a random IV
 *
 * @param plainText - The token to encrypt
 * @returns Encrypted token in format: iv:authTag:ciphertext
 * @throws Error if ENCRYPTION_KEY is not configured
 */
export function encryptToken(plainText: string): string {
  const keyHex = env.ENCRYPTION_KEY;

  if (!keyHex) {
    console.error("[ERROR] [ENCRYPTION] Encryption key not configured");
    throw new Error("Encryption key is not configured");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Encrypt JSON data for secure cookie storage
 *
 * @param data - The object to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext
 * @throws Error if ENCRYPTION_KEY is not configured
 */
export function encryptCookieData<T>(data: T): string {
  return encryptToken(JSON.stringify(data));
}

/**
 * Decrypt JSON data from secure cookie storage
 *
 * @param cipherText - The encrypted string
 * @returns Decrypted and parsed object
 * @throws Error if decryption fails or JSON is invalid
 */
export function decryptCookieData<T>(cipherText: string): T {
  const json = decryptToken(cipherText);
  return JSON.parse(json) as T;
}

/**
 * Decrypt a token encrypted with encryptToken
 *
 * @param cipherText - The encrypted token in format: iv:authTag:ciphertext
 * @returns Decrypted token
 * @throws Error if ENCRYPTION_KEY is not configured or decryption fails
 */
export function decryptToken(cipherText: string): string {
  const keyHex = env.ENCRYPTION_KEY;

  if (!keyHex) {
    console.error("[ERROR] [ENCRYPTION] Encryption key not configured");
    throw new Error("Encryption key is not configured");
  }

  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    console.error("[ERROR] [ENCRYPTION] Invalid ciphertext format");
    throw new Error("Invalid encrypted token format");
  }

  const ivHex = parts[0];
  const authTagHex = parts[1];
  const encrypted = parts[2];

  if (!ivHex || !authTagHex || !encrypted) {
    console.error("[ERROR] [ENCRYPTION] Invalid ciphertext format");
    throw new Error("Invalid encrypted token format");
  }

  const key = Buffer.from(keyHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
