/**
 * Tests for Bot Database Queries
 * Story 4.5: Rules-Based FAQ Matching Engine
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findProductByName,
  getAllProducts,
  getBusinessHours,
  getBusinessAddress,
  getBusinessPhone,
} from "./queries";

// Mock the admin client
const mockSingle = vi.fn();
const mockOrder = vi.fn(() => ({ data: null, error: null }));
const mockEq = vi.fn();

// Build chainable mock
const createChainableMock = () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    order: mockOrder,
  };
  return chain;
};

let mockChain: ReturnType<typeof createChainableMock>;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn(() => {
      return mockChain;
    }),
  }),
}));

const tenantId = "tenant-123";

describe("findProductByName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain = createChainableMock();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return exact match product", async () => {
    const products = [
      { id: "p1", name: "Coffee", price: 3.5, currency: "USD", is_active: true },
      { id: "p2", name: "Lok Lak", price: 8.0, currency: "USD", is_active: true },
    ];

    // findProductByName doesn't use .single() or .order(), it fetches all then filters
    // Override the last .eq() call to resolve the query
    mockChain.eq = vi.fn().mockImplementation(() => ({
      ...mockChain,
      eq: vi.fn().mockResolvedValue({ data: products, error: null }),
    }));

    const result = await findProductByName(tenantId, "coffee");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Coffee");
  });

  it("should return partial match (product name contains query)", async () => {
    const products = [
      { id: "p1", name: "Iced Coffee Latte", price: 4.0, currency: "USD", is_active: true },
    ];

    mockChain.eq = vi.fn().mockImplementation(() => ({
      ...mockChain,
      eq: vi.fn().mockResolvedValue({ data: products, error: null }),
    }));

    const result = await findProductByName(tenantId, "coffee");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Iced Coffee Latte");
  });

  it("should return reverse match (query contains product name)", async () => {
    const products = [
      { id: "p1", name: "Rice", price: 2.0, currency: "USD", is_active: true },
    ];

    mockChain.eq = vi.fn().mockImplementation(() => ({
      ...mockChain,
      eq: vi.fn().mockResolvedValue({ data: products, error: null }),
    }));

    const result = await findProductByName(tenantId, "fried rice special");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Rice");
  });

  it("should return null for no match", async () => {
    const products = [
      { id: "p1", name: "Coffee", price: 3.5, currency: "USD", is_active: true },
    ];

    mockChain.eq = vi.fn().mockImplementation(() => ({
      ...mockChain,
      eq: vi.fn().mockResolvedValue({ data: products, error: null }),
    }));

    const result = await findProductByName(tenantId, "pizza");
    expect(result).toBeNull();
  });

  it("should return null on database error", async () => {
    mockChain.eq = vi.fn().mockImplementation(() => ({
      ...mockChain,
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    }));

    const result = await findProductByName(tenantId, "coffee");
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [BOT] Product query failed:",
      expect.objectContaining({ tenantId })
    );
  });

  it("should return null when no products exist", async () => {
    mockChain.eq = vi.fn().mockImplementation(() => ({
      ...mockChain,
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    const result = await findProductByName(tenantId, "coffee");
    expect(result).toBeNull();
  });
});

describe("getAllProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain = createChainableMock();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return all active products", async () => {
    const products = [
      { id: "p1", name: "Coffee", price: 3.5, currency: "USD", is_active: true },
      { id: "p2", name: "Tea", price: 2.5, currency: "USD", is_active: true },
    ];

    mockOrder.mockResolvedValue({ data: products, error: null });

    const result = await getAllProducts(tenantId);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Coffee");
  });

  it("should return empty array on error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const result = await getAllProducts(tenantId);
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it("should return empty array when no products", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getAllProducts(tenantId);
    expect(result).toEqual([]);
  });
});

describe("getBusinessHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain = createChainableMock();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return opening hours when available", async () => {
    const hours = {
      monday: { open: "08:00", close: "17:00" },
      tuesday: { open: "08:00", close: "17:00" },
    };

    mockSingle.mockResolvedValue({
      data: { opening_hours: hours },
      error: null,
    });

    const result = await getBusinessHours(tenantId);
    expect(result).toEqual(hours);
  });

  it("should return null when no hours set", async () => {
    mockSingle.mockResolvedValue({
      data: { opening_hours: null },
      error: null,
    });

    const result = await getBusinessHours(tenantId);
    expect(result).toBeNull();
  });

  it("should return null on error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const result = await getBusinessHours(tenantId);
    expect(result).toBeNull();
  });
});

describe("getBusinessAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain = createChainableMock();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return address when available", async () => {
    mockSingle.mockResolvedValue({
      data: { address: "123 Street, Phnom Penh" },
      error: null,
    });

    const result = await getBusinessAddress(tenantId);
    expect(result).toBe("123 Street, Phnom Penh");
  });

  it("should return null when address is missing", async () => {
    mockSingle.mockResolvedValue({
      data: { address: null },
      error: null,
    });

    const result = await getBusinessAddress(tenantId);
    expect(result).toBeNull();
  });

  it("should return null on error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getBusinessAddress(tenantId);
    expect(result).toBeNull();
  });
});

describe("getBusinessPhone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain = createChainableMock();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return phone when available", async () => {
    mockSingle.mockResolvedValue({
      data: { phone: "+855 12 345 678" },
      error: null,
    });

    const result = await getBusinessPhone(tenantId);
    expect(result).toBe("+855 12 345 678");
  });

  it("should return null when phone is missing", async () => {
    mockSingle.mockResolvedValue({
      data: { phone: null },
      error: null,
    });

    const result = await getBusinessPhone(tenantId);
    expect(result).toBeNull();
  });

  it("should return null on error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getBusinessPhone(tenantId);
    expect(result).toBeNull();
  });
});
