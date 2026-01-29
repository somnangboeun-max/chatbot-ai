/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

// Mock env before importing the module
vi.mock("@/lib/env", () => ({
  env: {
    FACEBOOK_APP_SECRET: "test_app_secret_123",
  },
}));

import { verifySignature } from "./signature";

describe("verifySignature", () => {
  const testBody = JSON.stringify({ object: "page", entry: [] });
  const testSecret = "test_app_secret_123";

  // Calculate valid signature for test body
  const validSignature =
    "sha256=" +
    createHmac("sha256", testSecret).update(testBody).digest("hex");

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true for valid signature", () => {
    const result = verifySignature(testBody, validSignature);
    expect(result).toBe(true);
  });

  it("should return false for invalid signature", () => {
    const invalidSignature = "sha256=invalid_signature_here";
    const result = verifySignature(testBody, invalidSignature);
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] Invalid signature"
    );
  });

  it("should return false for missing signature header", () => {
    const result = verifySignature(testBody, null);
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] Missing signature header"
    );
  });

  it("should return false for empty signature header", () => {
    const result = verifySignature(testBody, "");
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] Missing signature header"
    );
  });

  it("should return false for malformed signature header (missing prefix)", () => {
    const signatureWithoutPrefix = createHmac("sha256", testSecret)
      .update(testBody)
      .digest("hex");
    const result = verifySignature(testBody, signatureWithoutPrefix);
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] Malformed signature header - missing sha256= prefix"
    );
  });

  it("should return false for tampered body", () => {
    const tamperedBody = JSON.stringify({ object: "page", entry: [{ id: "tampered" }] });
    // Using signature calculated for original body, but with tampered body
    const result = verifySignature(tamperedBody, validSignature);
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] Invalid signature"
    );
  });

  it("should return false for wrong algorithm prefix", () => {
    const sha1Signature = "sha1=" + createHmac("sha256", testSecret)
      .update(testBody)
      .digest("hex");
    const result = verifySignature(testBody, sha1Signature);
    expect(result).toBe(false);
  });
});
