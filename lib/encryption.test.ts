import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env before importing encryption module
vi.mock("./env", () => ({
  env: {
    ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  },
}));

import { encryptToken, decryptToken, encryptCookieData, decryptCookieData } from "./encryption";

describe("encryptToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("encrypts a token successfully", () => {
    const plainText = "my-secret-token";
    const encrypted = encryptToken(plainText);

    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toBe(plainText);
  });

  it("produces different ciphertext for same input (random IV)", () => {
    const plainText = "my-secret-token";
    const encrypted1 = encryptToken(plainText);
    const encrypted2 = encryptToken(plainText);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it("produces ciphertext in iv:authTag:ciphertext format", () => {
    const plainText = "test-token";
    const encrypted = encryptToken(plainText);
    const parts = encrypted.split(":");

    expect(parts).toHaveLength(3);
    // IV is 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32);
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext length varies
    expect(parts[2].length).toBeGreaterThan(0);
  });
});

describe("decryptToken", () => {
  it("decrypts an encrypted token correctly (round-trip)", () => {
    const plainText = "my-secret-token-12345";
    const encrypted = encryptToken(plainText);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(plainText);
  });

  it("handles special characters in token", () => {
    const plainText = "token!@#$%^&*()_+-={}[]|:;<>?,./~`";
    const encrypted = encryptToken(plainText);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(plainText);
  });

  it("handles unicode characters in token", () => {
    const plainText = "token-ភាសាខ្មែរ-日本語";
    const encrypted = encryptToken(plainText);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(plainText);
  });

  it("handles long tokens", () => {
    const plainText = "a".repeat(1000);
    const encrypted = encryptToken(plainText);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(plainText);
  });

  it("throws error for invalid ciphertext format", () => {
    expect(() => decryptToken("invalid-format")).toThrow(
      "Invalid encrypted token format"
    );
  });

  it("throws error for tampered ciphertext", () => {
    const plainText = "test-token";
    const encrypted = encryptToken(plainText);

    // Tamper with the ciphertext part
    const parts = encrypted.split(":");
    parts[2] = "0000" + parts[2].slice(4);
    const tampered = parts.join(":");

    expect(() => decryptToken(tampered)).toThrow();
  });

  it("throws error for tampered auth tag", () => {
    const plainText = "test-token";
    const encrypted = encryptToken(plainText);

    // Tamper with the auth tag
    const parts = encrypted.split(":");
    parts[1] = "0000" + parts[1].slice(4);
    const tampered = parts.join(":");

    expect(() => decryptToken(tampered)).toThrow();
  });
});

describe("encryptCookieData and decryptCookieData", () => {
  it("encrypts and decrypts objects correctly (round-trip)", () => {
    const data = {
      pages: [{ id: "page-1", name: "Test Page", access_token: "secret-token" }],
      expiresAt: 1706400000000,
    };

    const encrypted = encryptCookieData(data);
    const decrypted = decryptCookieData<typeof data>(encrypted);

    expect(decrypted).toEqual(data);
  });

  it("handles nested objects", () => {
    const data = {
      user: {
        profile: {
          name: "John",
          settings: { theme: "dark" },
        },
      },
    };

    const encrypted = encryptCookieData(data);
    const decrypted = decryptCookieData<typeof data>(encrypted);

    expect(decrypted).toEqual(data);
  });

  it("handles arrays", () => {
    const data = ["item1", "item2", "item3"];

    const encrypted = encryptCookieData(data);
    const decrypted = decryptCookieData<typeof data>(encrypted);

    expect(decrypted).toEqual(data);
  });

  it("produces different ciphertext for same object", () => {
    const data = { key: "value" };

    const encrypted1 = encryptCookieData(data);
    const encrypted2 = encryptCookieData(data);

    expect(encrypted1).not.toBe(encrypted2);
  });
});

describe("encryption without key", () => {
  it("throws error when ENCRYPTION_KEY is not configured", async () => {
    // Reset modules to test missing key scenario
    vi.resetModules();
    vi.doMock("./env", () => ({
      env: {
        ENCRYPTION_KEY: undefined,
      },
    }));

    const { encryptToken: encryptWithoutKey } = await import("./encryption");

    expect(() => encryptWithoutKey("test")).toThrow(
      "Encryption key is not configured"
    );
  });
});
