import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateBusinessInfo, updateBusinessHours } from "./business";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
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

describe("updateBusinessInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await updateBusinessInfo({
      name: "Test Business",
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

    const result = await updateBusinessInfo({
      name: "Test Business",
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

    const result = await updateBusinessInfo({
      name: "", // Empty name should fail validation
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns success with valid data", async () => {
    const mockBusiness = {
      id: "tenant-id",
      name: "Updated Business",
      address: '{"street":"123 St","city":"PP","landmarks":""}',
      phone: "012345678",
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
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBusiness,
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await updateBusinessInfo({
      name: "Updated Business",
      address: "123 St",
      city: "PP",
      phone: "012345678",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Business");
    }
  });

  it("validates phone number format", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const result = await updateBusinessInfo({
      name: "Test Business",
      phone: "invalid-phone",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

describe("updateBusinessHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await updateBusinessHours({
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "18:00" },
      sunday: { closed: true },
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

    const result = await updateBusinessHours({
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "18:00" },
      sunday: { closed: true },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("validates time format", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const result = await updateBusinessHours({
      monday: { open: "invalid", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "18:00" },
      sunday: { closed: true },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns success with valid hours data", async () => {
    const validHours = {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: { closed: true },
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
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "tenant-id", opening_hours: validHours },
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await updateBusinessHours(validHours);

    expect(result.success).toBe(true);
  });
});
