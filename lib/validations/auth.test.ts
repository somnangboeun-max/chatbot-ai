/**
 * @vitest-environment node
 * Validation schemas are pure JavaScript and don't need DOM environment
 */
import { describe, it, expect } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  emailSchema,
} from "./auth";

describe("forgotPasswordSchema", () => {
  it("should validate a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "invalid-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("should reject an empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });
});

describe("resetPasswordSchema", () => {
  it("should validate matching passwords with 8+ characters", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject password less than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it("should reject mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });

  it("should reject empty password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty confirm password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });

  it("should accept exactly 8 character password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "exactly8",
      confirmPassword: "exactly8",
    });
    expect(result.success).toBe(true);
  });
});

describe("emailSchema", () => {
  it("should validate a valid email", () => {
    const result = emailSchema.safeParse("user@example.com");
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email format", () => {
    const result = emailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});
