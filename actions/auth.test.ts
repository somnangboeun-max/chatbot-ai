/**
 * @vitest-environment node
 * Server action tests use mocked Supabase and don't need DOM environment
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestPasswordReset, updatePassword } from "./auth";

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn();
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
        signOut: mockSignOut,
      },
    })
  ),
}));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success for valid email", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.append("email", "test@example.com");

    const result = await requestPasswordReset(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("Check your email for reset instructions");
    }
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/auth/confirm?type=recovery") })
    );
  });

  it("should return success even if email does not exist (prevent enumeration)", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    });

    const formData = new FormData();
    formData.append("email", "nonexistent@example.com");

    const result = await requestPasswordReset(formData);

    // Should still return success to prevent email enumeration
    expect(result.success).toBe(true);
  });

  it("should return validation error for invalid email", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");

    const result = await requestPasswordReset(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should return validation error for empty email", async () => {
    const formData = new FormData();
    formData.append("email", "");

    const result = await requestPasswordReset(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update password for authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.append("password", "newpassword123");
    formData.append("confirmPassword", "newpassword123");

    const result = await updatePassword(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("Password updated successfully");
    }
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    expect(mockSignOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("should return unauthorized if no user session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const formData = new FormData();
    formData.append("password", "newpassword123");
    formData.append("confirmPassword", "newpassword123");

    const result = await updatePassword(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toContain("expired");
    }
  });

  it("should return validation error for short password", async () => {
    const formData = new FormData();
    formData.append("password", "short");
    formData.append("confirmPassword", "short");

    const result = await updatePassword(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should return validation error for mismatched passwords", async () => {
    const formData = new FormData();
    formData.append("password", "password123");
    formData.append("confirmPassword", "different123");

    const result = await updatePassword(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should return server error if updateUser fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });

    const formData = new FormData();
    formData.append("password", "newpassword123");
    formData.append("confirmPassword", "newpassword123");

    const result = await updatePassword(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SERVER_ERROR");
    }
  });
});
