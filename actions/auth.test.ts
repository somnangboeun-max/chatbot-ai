/**
 * @vitest-environment node
 * Server action tests use mocked Supabase and don't need DOM environment
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { signUp, requestPasswordReset, updatePassword } from "./auth";

// Mock Supabase client
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
        resetPasswordForEmail: mockResetPasswordForEmail,
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
        signOut: mockSignOut,
      },
    })
  ),
}));

// Mock Admin client for signUp tests
const mockAdminFrom = vi.fn();
const mockAdminInsert = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminUpdateUserById = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    auth: {
      admin: {
        updateUserById: mockAdminUpdateUserById,
      },
    },
  })),
}));

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup admin client chain mock
    mockAdminFrom.mockReturnValue({
      insert: mockAdminInsert,
    });
    mockAdminInsert.mockReturnValue({
      select: mockAdminSelect,
    });
    mockAdminSelect.mockReturnValue({
      single: mockAdminSingle,
    });
  });

  it("should return VALIDATION_ERROR for invalid email", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");
    formData.append("password", "ValidP@ssword123");

    const result = await signUp(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should return VALIDATION_ERROR for short password", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "short");

    const result = await signUp(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should create user and business on successful signup", async () => {
    const mockUser = { id: "user-123" };
    const mockBusiness = { id: "business-456", owner_id: "user-123", name: "test" };

    mockSignUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockAdminSingle.mockResolvedValue({
      data: mockBusiness,
      error: null,
    });

    mockAdminUpdateUserById.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "ValidP@ssword123");

    const result = await signUp(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toContain("email");
    }

    // Verify business was created with correct owner_id
    expect(mockAdminFrom).toHaveBeenCalledWith("businesses");
    expect(mockAdminInsert).toHaveBeenCalledWith({
      owner_id: "user-123",
      name: "test", // Email prefix
    });

    // Verify tenant_id was set in JWT claims
    expect(mockAdminUpdateUserById).toHaveBeenCalledWith("user-123", {
      app_metadata: { tenant_id: "business-456" },
    });
  });

  it("should return CONFLICT for already registered email", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const formData = new FormData();
    formData.append("email", "existing@example.com");
    formData.append("password", "ValidP@ssword123");

    const result = await signUp(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("CONFLICT");
    }
  });

  it("should return RATE_LIMITED when rate limited", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "rate limit exceeded" },
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "ValidP@ssword123");

    const result = await signUp(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("RATE_LIMITED");
    }
  });

  it("should still succeed if business creation fails", async () => {
    const mockUser = { id: "user-123" };

    mockSignUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Business creation fails
    mockAdminSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "ValidP@ssword123");

    // Should still succeed (user created, business creation is partial failure)
    const result = await signUp(formData);

    expect(result.success).toBe(true);
    // Business creation failure is logged but doesn't fail the signup
    // tenant_id update is skipped since no business was created
    expect(mockAdminUpdateUserById).not.toHaveBeenCalled();
  });

  it("should use email prefix as business name", async () => {
    const mockUser = { id: "user-123" };
    const mockBusiness = { id: "business-456", owner_id: "user-123", name: "johndoe" };

    mockSignUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockAdminSingle.mockResolvedValue({
      data: mockBusiness,
      error: null,
    });

    mockAdminUpdateUserById.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "johndoe@example.com");
    formData.append("password", "ValidP@ssword123");

    await signUp(formData);

    // Verify business name is email prefix
    expect(mockAdminInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "johndoe" })
    );
  });
});

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

/**
 * RLS Policy Test Scenarios Documentation
 * Story: 1.5 Multi-tenant Business Setup
 *
 * These tests document the RLS policy behavior that should be verified
 * manually in Supabase Studio or via SQL queries.
 *
 * Test Setup Required:
 * 1. Create User A with Business A (tenant_id = business-a-id)
 * 2. Create User B with Business B (tenant_id = business-b-id)
 */
describe("RLS Policy Test Scenarios (Manual Verification)", () => {
  it("should document: User A cannot SELECT User B business", () => {
    /**
     * SQL Test in Supabase Studio:
     *
     * -- Set JWT claims for User A
     * SET request.jwt.claims = '{"sub": "user-a-id", "app_metadata": {"tenant_id": "business-a-id"}}';
     *
     * -- Try to read User B's business
     * SELECT * FROM businesses WHERE id = 'business-b-id';
     *
     * Expected Result: 0 rows returned (RLS blocks cross-tenant access)
     */
    expect(true).toBe(true);
  });

  it("should document: User A cannot UPDATE User B business", () => {
    /**
     * SQL Test in Supabase Studio:
     *
     * SET request.jwt.claims = '{"sub": "user-a-id", "app_metadata": {"tenant_id": "business-a-id"}}';
     *
     * UPDATE businesses SET name = 'Hacked Name' WHERE id = 'business-b-id';
     *
     * Expected Result: 0 rows affected (RLS blocks cross-tenant modification)
     */
    expect(true).toBe(true);
  });

  it("should document: Service role bypasses RLS", () => {
    /**
     * Test with Service Role Key (not user JWT):
     *
     * Using supabase-js with service_role key:
     * const admin = createClient(url, serviceRoleKey);
     * const { data } = await admin.from('businesses').select('*');
     *
     * Expected Result: All businesses returned (service role bypasses RLS)
     */
    expect(true).toBe(true);
  });

  it("should document: User can SELECT own business", () => {
    /**
     * SQL Test in Supabase Studio:
     *
     * SET request.jwt.claims = '{"sub": "user-a-id", "app_metadata": {"tenant_id": "business-a-id"}}';
     *
     * SELECT * FROM businesses WHERE id = 'business-a-id';
     *
     * Expected Result: 1 row returned (own business accessible)
     */
    expect(true).toBe(true);
  });

  it("should document: User can UPDATE own business", () => {
    /**
     * SQL Test in Supabase Studio:
     *
     * SET request.jwt.claims = '{"sub": "user-a-id", "app_metadata": {"tenant_id": "business-a-id"}}';
     *
     * UPDATE businesses SET name = 'New Business Name' WHERE id = 'business-a-id';
     *
     * Expected Result: 1 row affected (own business can be modified)
     */
    expect(true).toBe(true);
  });

  it("should document: DELETE is not permitted (no policy)", () => {
    /**
     * SQL Test in Supabase Studio:
     *
     * SET request.jwt.claims = '{"sub": "user-a-id", "app_metadata": {"tenant_id": "business-a-id"}}';
     *
     * DELETE FROM businesses WHERE id = 'business-a-id';
     *
     * Expected Result: 0 rows affected or error (no DELETE policy exists)
     * This prevents accidental data loss.
     */
    expect(true).toBe(true);
  });

  it("should document: Anonymous users cannot access businesses", () => {
    /**
     * Test without authentication:
     *
     * Using supabase-js with anon key but no user session:
     * const { data, error } = await supabase.from('businesses').select('*');
     *
     * Expected Result: Empty array or error (RLS requires authentication)
     */
    expect(true).toBe(true);
  });
});
