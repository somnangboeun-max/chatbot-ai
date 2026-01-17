import { describe, it, expect } from "vitest";
import { signupSchema, emailSchema } from "./auth";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse("test@example.com");
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message;
      expect(message).toBe("Email is required");
    }
  });

  it("rejects invalid email format", () => {
    const result = emailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues?.[0]?.message ?? result.error.errors?.[0]?.message;
      expect(message).toBe("Please enter a valid email address");
    }
  });
});

describe("signupSchema", () => {
  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues?.[0]?.message ?? result.error.errors?.[0]?.message;
      expect(message).toBe("Password must be at least 8 characters");
    }
  });

  it("rejects empty password", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email in signup", () => {
    const result = signupSchema.safeParse({
      email: "invalid",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 8 character password", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });
});
