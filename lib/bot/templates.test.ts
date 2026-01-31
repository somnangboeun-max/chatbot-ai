/**
 * Tests for Bot Response Templates
 * Story 4.6: Khmer Language Response Templates
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getDefaultResponse,
  getHandoverResponse,
  getBusinessHoursUnknownResponse,
  formatPriceResponse,
  formatProductListResponse,
  formatProductNotFoundResponse,
  formatHoursResponse,
  formatAddressResponse,
  formatPhoneResponse,
  formatNoMatchResponse,
  formatNoDataResponse,
  formatCurrency,
  getGreetingResponse,
  getFarewellResponse,
  getClosedNowResponse,
  getErrorResponse,
} from "./templates";
import type { Product, BusinessInfo } from "./types";

/** Regex to match at least one Khmer Unicode character (U+1780-U+17FF) */
const KHMER_REGEX = /[\u1780-\u17FF]/;

// ── Helper ────────────────────────────────────────────────────────

function expectKhmerContent(text: string) {
  expect(text).toMatch(KHMER_REGEX);
}

function expectNonEmpty(text: string) {
  expect(text.length).toBeGreaterThan(0);
}

// ── Existing Templates ────────────────────────────────────────────

describe("Existing templates (Story 4.3/4.5)", () => {
  it("getDefaultResponse returns non-empty Khmer string", () => {
    const result = getDefaultResponse();
    expectNonEmpty(result);
    expectKhmerContent(result);
  });

  it("getHandoverResponse returns non-empty Khmer string", () => {
    const result = getHandoverResponse();
    expectNonEmpty(result);
    expectKhmerContent(result);
  });

  it("getBusinessHoursUnknownResponse returns non-empty Khmer string", () => {
    const result = getBusinessHoursUnknownResponse();
    expectNonEmpty(result);
    expectKhmerContent(result);
  });

  it("formatPriceResponse includes product name and Khmer text", () => {
    const result = formatPriceResponse("Lok Lak", 8.0, "USD");
    expectNonEmpty(result);
    expectKhmerContent(result);
    expect(result).toContain("Lok Lak");
    expect(result).toContain("$8.00");
  });

  it("formatProductListResponse includes all products in Khmer", () => {
    const products: Product[] = [
      { id: "1", name: "Coffee", price: 3.5, currency: "USD", is_active: true },
      { id: "2", name: "Tea", price: 2.0, currency: "USD", is_active: true },
    ];
    const result = formatProductListResponse(products);
    expectNonEmpty(result);
    expectKhmerContent(result);
    expect(result).toContain("Coffee");
    expect(result).toContain("Tea");
  });

  it("formatProductNotFoundResponse includes query, alternatives, and closing politeness", () => {
    const products: Product[] = [
      { id: "1", name: "Coffee", price: 3.5, currency: "USD", is_active: true },
    ];
    const result = formatProductNotFoundResponse("pizza", products);
    expectNonEmpty(result);
    expectKhmerContent(result);
    expect(result).toContain("pizza");
    expect(result).toContain("Coffee");
    // Should have closing politeness marker (សូម)
    expect(result).toContain("សូម");
  });

  it("formatHoursResponse includes Khmer day names", () => {
    const hours: NonNullable<BusinessInfo["opening_hours"]> = {
      monday: { open: "08:00", close: "17:00" },
      friday: { open: "08:00", close: "15:00" },
    };
    const result = formatHoursResponse(hours);
    expectNonEmpty(result);
    expectKhmerContent(result);
    expect(result).toContain("ច័ន្ទ"); // Monday in Khmer
    expect(result).toContain("សុក្រ"); // Friday in Khmer
  });

  it("formatHoursResponse returns unknown response when no hours", () => {
    const result = formatHoursResponse({});
    expect(result).toBe(getBusinessHoursUnknownResponse());
  });

  it("formatAddressResponse includes address and Khmer text", () => {
    const result = formatAddressResponse("123 Street, Phnom Penh");
    expectNonEmpty(result);
    expectKhmerContent(result);
    expect(result).toContain("123 Street, Phnom Penh");
  });

  it("formatPhoneResponse includes phone number and Khmer text", () => {
    const result = formatPhoneResponse("+855 12 345 678");
    expectNonEmpty(result);
    expectKhmerContent(result);
    expect(result).toContain("+855 12 345 678");
  });

  it("formatNoMatchResponse delegates to handover response", () => {
    expect(formatNoMatchResponse()).toBe(getHandoverResponse());
  });

  it("formatNoDataResponse returns Khmer for each category", () => {
    const categories = ["products", "hours", "address", "phone"] as const;
    for (const cat of categories) {
      const result = formatNoDataResponse(cat);
      expectNonEmpty(result);
      expectKhmerContent(result);
    }
  });

  it("formatCurrency formats USD correctly", () => {
    expect(formatCurrency(8.5, "USD")).toBe("$8.50");
  });

  it("formatCurrency formats KHR correctly", () => {
    const result = formatCurrency(4000, "KHR");
    expect(result).toContain("រៀល");
    expect(result).toContain("4,000");
  });
});

// ── Greeting Templates (Story 4.6) ───────────────────────────────

describe("getGreetingResponse", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns non-empty string", () => {
    expectNonEmpty(getGreetingResponse());
  });

  it("returns Khmer content", () => {
    expectKhmerContent(getGreetingResponse());
  });

  it("includes business name when provided", () => {
    const result = getGreetingResponse("Coffee Shop");
    expect(result).toContain("Coffee Shop");
    expectKhmerContent(result);
  });

  it("returns formal greeting with business name", () => {
    const result = getGreetingResponse("បាយ Phnom Penh");
    expect(result).toContain("បាយ Phnom Penh");
    // Should contain welcome (សូមស្វាគមន៍)
    expect(result).toContain("សូមស្វាគមន៍");
  });

  it("returns time-aware greeting when minutes are even and no business name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 9, 0)); // 9:00 AM, minutes=0 (even)
    const result = getGreetingResponse();
    expectKhmerContent(result);
    expect(result).toContain("អរុណសួស្តី"); // Morning greeting
    vi.useRealTimers();
  });

  it("returns afternoon greeting for afternoon time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 14, 0)); // 2:00 PM, minutes=0 (even)
    const result = getGreetingResponse();
    expectKhmerContent(result);
    expect(result).toContain("ទិវាសួស្តី"); // Afternoon greeting
    vi.useRealTimers();
  });

  it("returns evening greeting for evening time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 19, 0)); // 7:00 PM, minutes=0 (even)
    const result = getGreetingResponse();
    expectKhmerContent(result);
    expect(result).toContain("សាយ័ណ្ហសួស្តី"); // Evening greeting
    vi.useRealTimers();
  });

  it("returns generic greeting when minutes are odd and no business name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 9, 1)); // 9:01 AM, minutes=1 (odd)
    const result = getGreetingResponse();
    expectKhmerContent(result);
    expect(result).toContain("សូមអរគុណ"); // Thank you for contacting
    vi.useRealTimers();
  });
});

// ── Farewell Templates (Story 4.6) ──────────────────────────────

describe("getFarewellResponse", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns non-empty string", () => {
    expectNonEmpty(getFarewellResponse());
  });

  it("returns Khmer content", () => {
    expectKhmerContent(getFarewellResponse());
  });

  it("includes politeness markers", () => {
    const result = getFarewellResponse();
    // Should contain សូមអរគុណ (thank you)
    expect(result).toContain("សូមអរគុណ");
  });

  it("returns variant 1 when minutes are even", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 10, 0)); // minutes=0 (even)
    const result = getFarewellResponse();
    expectKhmerContent(result);
    expect(result).toContain("ថ្ងៃល្អ"); // "good day"
    vi.useRealTimers();
  });

  it("returns variant 2 when minutes are odd", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 10, 1)); // minutes=1 (odd)
    const result = getFarewellResponse();
    expectKhmerContent(result);
    expect(result).toContain("រីករាយ"); // "happy to help"
    vi.useRealTimers();
  });
});

// ── Closed Now Template (Story 4.6) ─────────────────────────────

describe("getClosedNowResponse", () => {
  it("returns non-empty string", () => {
    expectNonEmpty(getClosedNowResponse("08:00", "ច័ន្ទ"));
  });

  it("returns Khmer content", () => {
    expectKhmerContent(getClosedNowResponse("08:00", "ច័ន្ទ"));
  });

  it("includes next open time", () => {
    const result = getClosedNowResponse("08:00", "ច័ន្ទ");
    expect(result).toContain("08:00");
  });

  it("includes next open day", () => {
    const result = getClosedNowResponse("09:30", "សុក្រ");
    expect(result).toContain("សុក្រ");
  });

  it("includes apology marker (អភ័យទោស)", () => {
    const result = getClosedNowResponse("08:00", "ច័ន្ទ");
    expect(result).toContain("អភ័យទោស");
  });

  it("includes thank you marker (សូមអរគុណ)", () => {
    const result = getClosedNowResponse("08:00", "ច័ន្ទ");
    expect(result).toContain("សូមអរគុណ");
  });
});

// ── Error Template (Story 4.6) ──────────────────────────────────

describe("getErrorResponse", () => {
  it("returns non-empty string", () => {
    expectNonEmpty(getErrorResponse());
  });

  it("returns Khmer content", () => {
    expectKhmerContent(getErrorResponse());
  });

  it("includes apology marker", () => {
    expect(getErrorResponse()).toContain("អភ័យទោស");
  });

  it("includes retry suggestion (សាកល្បង - try)", () => {
    expect(getErrorResponse()).toContain("សាកល្បង");
  });

  it("includes contact suggestion (ទាក់ទង - contact)", () => {
    expect(getErrorResponse()).toContain("ទាក់ទង");
  });
});

// ── All Templates Khmer Verification ────────────────────────────

describe("All template functions return Khmer content", () => {
  const testProducts: Product[] = [
    { id: "1", name: "Coffee", price: 3.5, currency: "USD", is_active: true },
  ];

  const allTemplateOutputs: [string, string][] = [
    ["getDefaultResponse", getDefaultResponse()],
    ["getHandoverResponse", getHandoverResponse()],
    ["getBusinessHoursUnknownResponse", getBusinessHoursUnknownResponse()],
    ["formatPriceResponse", formatPriceResponse("Test", 5, "USD")],
    ["formatProductListResponse", formatProductListResponse(testProducts)],
    [
      "formatProductNotFoundResponse",
      formatProductNotFoundResponse("x", testProducts),
    ],
    [
      "formatHoursResponse",
      formatHoursResponse({ monday: { open: "08:00", close: "17:00" } }),
    ],
    ["formatAddressResponse", formatAddressResponse("Test Address")],
    ["formatPhoneResponse", formatPhoneResponse("+855 12 345")],
    ["formatNoMatchResponse", formatNoMatchResponse()],
    ["formatNoDataResponse (products)", formatNoDataResponse("products")],
    ["formatNoDataResponse (hours)", formatNoDataResponse("hours")],
    ["formatNoDataResponse (address)", formatNoDataResponse("address")],
    ["formatNoDataResponse (phone)", formatNoDataResponse("phone")],
    ["getGreetingResponse (no name)", getGreetingResponse()],
    ["getGreetingResponse (with name)", getGreetingResponse("Test Shop")],
    ["getFarewellResponse", getFarewellResponse()],
    ["getClosedNowResponse", getClosedNowResponse("08:00", "ច័ន្ទ")],
    ["getErrorResponse", getErrorResponse()],
  ];

  it.each(allTemplateOutputs)(
    "%s contains Khmer Unicode characters",
    (_name, output) => {
      expect(output).toMatch(KHMER_REGEX);
    }
  );

  it.each(allTemplateOutputs)(
    "%s returns non-empty string",
    (_name, output) => {
      expect(output.length).toBeGreaterThan(0);
    }
  );
});
