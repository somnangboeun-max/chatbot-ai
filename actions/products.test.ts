import { describe, it, expect, vi, beforeEach } from "vitest";
import { addProduct, updateProduct, deleteProduct } from "./products";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("addProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await addProduct({
      name: "Test Product",
      price: 5.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: {},
        },
      },
      error: null,
    });

    const result = await addProduct({
      name: "Test Product",
      price: 5.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns VALIDATION_ERROR for empty name", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const result = await addProduct({
      name: "",
      price: 5.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns VALIDATION_ERROR for negative price", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const result = await addProduct({
      name: "Test Product",
      price: -5.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns success with valid data", async () => {
    const mockProduct = {
      id: "product-id",
      tenant_id: "tenant-id",
      name: "Lok Lak",
      price: 5.0,
      currency: "USD",
      is_active: true,
      created_at: "2026-01-20T00:00:00Z",
      updated_at: "2026-01-20T00:00:00Z",
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProduct,
            error: null,
          }),
        }),
      }),
    });

    const result = await addProduct({
      name: "Lok Lak",
      price: 5.0,
      currency: "USD",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Lok Lak");
      expect(result.data.price).toBe(5.0);
    }
  });

  it("returns SERVER_ERROR when database insert fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      }),
    });

    const result = await addProduct({
      name: "Test Product",
      price: 5.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SERVER_ERROR");
    }
  });
});

describe("updateProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await updateProduct("product-id", {
      name: "Updated Name",
      price: 10.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: {},
        },
      },
      error: null,
    });

    const result = await updateProduct("product-id", {
      name: "Updated Name",
      price: 10.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns VALIDATION_ERROR for invalid data", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const result = await updateProduct("product-id", {
      name: "",
      price: 10.0,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns success with valid update data", async () => {
    const mockUpdatedProduct = {
      id: "product-id",
      tenant_id: "tenant-id",
      name: "Updated Lok Lak",
      price: 7.5,
      currency: "USD",
      is_active: true,
      created_at: "2026-01-20T00:00:00Z",
      updated_at: "2026-01-20T01:00:00Z",
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedProduct,
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const result = await updateProduct("product-id", {
      name: "Updated Lok Lak",
      price: 7.5,
      currency: "USD",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Lok Lak");
      expect(result.data.price).toBe(7.5);
    }
  });
});

describe("deleteProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await deleteProduct("product-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: {},
        },
      },
      error: null,
    });

    const result = await deleteProduct("product-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns success when delete succeeds (soft delete)", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    });

    const result = await deleteProduct("product-id");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deleted).toBe(true);
    }
  });

  it("returns SERVER_ERROR when delete fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "Database error" },
          }),
        }),
      }),
    });

    const result = await deleteProduct("product-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SERVER_ERROR");
    }
  });
});
