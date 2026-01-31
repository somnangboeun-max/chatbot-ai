/**
 * Tests for Bot Response Engine
 * Story 4.5: Rules-Based FAQ Matching Engine
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { processMessage } from "./engine";

// Mock dependencies
vi.mock("./rules", () => ({
  classifyIntent: vi.fn(),
}));

vi.mock("./queries", () => ({
  findProductByName: vi.fn(),
  getAllProducts: vi.fn(),
  getBusinessHours: vi.fn(),
  getBusinessAddress: vi.fn(),
  getBusinessPhone: vi.fn(),
  getBusinessName: vi.fn(),
}));

vi.mock("./templates", () => ({
  formatPriceResponse: vi.fn(
    (name: string, price: number, currency: string) =>
      `${name}: ${price} ${currency}`
  ),
  formatProductListResponse: vi.fn(() => "Product list response"),
  formatProductNotFoundResponse: vi.fn(() => "Product not found response"),
  formatHoursResponse: vi.fn(() => "Hours response"),
  formatAddressResponse: vi.fn(() => "Address response"),
  formatPhoneResponse: vi.fn(() => "Phone response"),
  formatNoMatchResponse: vi.fn(() => "No match response"),
  formatNoDataResponse: vi.fn((cat: string) => `No ${cat} data`),
  getGreetingResponse: vi.fn(() => "Greeting response"),
  getFarewellResponse: vi.fn(() => "Farewell response"),
  getClosedNowResponse: vi.fn(
    (time: string, day: string) => `Closed now, open ${day} ${time}`
  ),
  getErrorResponse: vi.fn(() => "Error response"),
}));

import { classifyIntent } from "./rules";
import {
  findProductByName,
  getAllProducts,
  getBusinessHours,
  getBusinessAddress,
  getBusinessPhone,
  getBusinessName,
} from "./queries";
import type { Mock } from "vitest";

const tenantId = "tenant-123";

describe("processMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("price queries", () => {
    it("should return price for a specific product (Khmer query)", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "high",
        extractedEntity: "lok lak",
      });
      (findProductByName as Mock).mockResolvedValue({
        name: "Lok Lak",
        price: 8.0,
        currency: "USD",
      });

      const result = await processMessage(tenantId, "តម្លៃ lok lak ប៉ុន្មាន");

      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("high");
      expect(result.matchedProduct).toBe("Lok Lak");
      expect(findProductByName).toHaveBeenCalledWith(tenantId, "lok lak");
    });

    it("should return price for a specific product (English query)", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "high",
        extractedEntity: "coffee",
      });
      (findProductByName as Mock).mockResolvedValue({
        name: "Coffee",
        price: 3.5,
        currency: "USD",
      });

      const result = await processMessage(tenantId, "price of coffee");

      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("high");
      expect(result.matchedProduct).toBe("Coffee");
    });

    it("should return product list when no product name extracted", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "medium",
      });
      (getAllProducts as Mock).mockResolvedValue([
        { name: "Coffee", price: 3.5, currency: "USD" },
        { name: "Tea", price: 2.5, currency: "USD" },
      ]);

      const result = await processMessage(tenantId, "menu");

      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("medium");
      expect(getAllProducts).toHaveBeenCalledWith(tenantId);
    });

    it("should return product not found with available list", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "high",
        extractedEntity: "pizza",
      });
      (findProductByName as Mock).mockResolvedValue(null);
      (getAllProducts as Mock).mockResolvedValue([
        { name: "Coffee", price: 3.5, currency: "USD" },
      ]);

      const result = await processMessage(tenantId, "price of pizza");

      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("medium");
    });

    it("should return low confidence when no products exist at all", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "medium",
      });
      (getAllProducts as Mock).mockResolvedValue([]);

      const result = await processMessage(tenantId, "menu");

      expect(result.confidence).toBe("low");
    });

    it("should handle mixed Khmer-English price query", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "high",
        extractedEntity: "coffee",
      });
      (findProductByName as Mock).mockResolvedValue({
        name: "Coffee",
        price: 3.5,
        currency: "USD",
      });

      const result = await processMessage(tenantId, "តម្លៃ coffee ប៉ុន្មាន");

      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("high");
    });
  });

  describe("hours queries", () => {
    it("should return formatted hours when business is open", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 26, 10, 0)); // Monday 10:00 AM

      (classifyIntent as Mock).mockReturnValue({
        intent: "hours_query",
        confidence: "high",
      });
      (getBusinessHours as Mock).mockResolvedValue({
        monday: { open: "08:00", close: "17:00" },
      });

      const result = await processMessage(tenantId, "What are your hours?");

      expect(result.intent).toBe("hours_query");
      expect(result.confidence).toBe("high");
      expect(result.responseText).toBe("Hours response");
      expect(getBusinessHours).toHaveBeenCalledWith(tenantId);
      vi.useRealTimers();
    });

    it("should return low confidence when hours not available", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "hours_query",
        confidence: "high",
      });
      (getBusinessHours as Mock).mockResolvedValue(null);

      const result = await processMessage(tenantId, "ម៉ោង បើក");

      expect(result.confidence).toBe("low");
    });
  });

  describe("location queries", () => {
    it("should return address", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "location_query",
        confidence: "high",
      });
      (getBusinessAddress as Mock).mockResolvedValue("123 Street, Phnom Penh");

      const result = await processMessage(tenantId, "Where are you?");

      expect(result.intent).toBe("location_query");
      expect(result.confidence).toBe("high");
      expect(getBusinessAddress).toHaveBeenCalledWith(tenantId);
    });

    it("should return low confidence when address not available", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "location_query",
        confidence: "high",
      });
      (getBusinessAddress as Mock).mockResolvedValue(null);

      const result = await processMessage(tenantId, "ទីតាំង");

      expect(result.confidence).toBe("low");
    });
  });

  describe("phone queries", () => {
    it("should return phone number", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "phone_query",
        confidence: "high",
      });
      (getBusinessPhone as Mock).mockResolvedValue("+855 12 345 678");

      const result = await processMessage(tenantId, "phone number");

      expect(result.intent).toBe("phone_query");
      expect(result.confidence).toBe("high");
    });
  });

  describe("unknown queries", () => {
    it("should return low confidence for unrecognized messages", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "general_faq",
        confidence: "low",
      });

      const result = await processMessage(tenantId, "Hello!");

      expect(result.intent).toBe("general_faq");
      expect(result.confidence).toBe("low");
    });
  });

  describe("multiple matching rules", () => {
    it("should use the intent returned by classifyIntent (priority order)", async () => {
      // classifyIntent handles priority internally
      (classifyIntent as Mock).mockReturnValue({
        intent: "price_query",
        confidence: "high",
        extractedEntity: "coffee",
      });
      (findProductByName as Mock).mockResolvedValue({
        name: "Coffee",
        price: 3.5,
        currency: "USD",
      });

      const result = await processMessage(
        tenantId,
        "Where can I find the price of coffee?"
      );

      expect(result.intent).toBe("price_query");
    });
  });

  describe("greeting queries (Story 4.6)", () => {
    it("should return greeting template with high confidence", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "greeting",
        confidence: "high",
      });
      (getBusinessName as Mock).mockResolvedValue("Test Shop");

      const result = await processMessage(tenantId, "សួស្តី");

      expect(result.intent).toBe("greeting");
      expect(result.confidence).toBe("high");
      expect(result.responseText).toBe("Greeting response");
    });

    it("should handle English greeting", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "greeting",
        confidence: "high",
      });
      (getBusinessName as Mock).mockResolvedValue(null);

      const result = await processMessage(tenantId, "hello");

      expect(result.intent).toBe("greeting");
      expect(result.confidence).toBe("high");
    });
  });

  describe("farewell queries (Story 4.6)", () => {
    it("should return farewell template with high confidence", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "farewell",
        confidence: "high",
      });

      const result = await processMessage(tenantId, "ជំរាបលា");

      expect(result.intent).toBe("farewell");
      expect(result.confidence).toBe("high");
      expect(result.responseText).toBe("Farewell response");
    });

    it("should handle English farewell", async () => {
      (classifyIntent as Mock).mockReturnValue({
        intent: "farewell",
        confidence: "high",
      });

      const result = await processMessage(tenantId, "goodbye");

      expect(result.intent).toBe("farewell");
      expect(result.confidence).toBe("high");
    });
  });

  describe("hours query with closed-now detection (Story 4.6)", () => {
    it("should return closed-now template when business is currently closed", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 26, 20, 0)); // Monday 8:00 PM (after close)

      (classifyIntent as Mock).mockReturnValue({
        intent: "hours_query",
        confidence: "high",
      });
      (getBusinessHours as Mock).mockResolvedValue({
        monday: { open: "08:00", close: "17:00" },
      });

      const result = await processMessage(tenantId, "ម៉ោង បើក");

      expect(result.intent).toBe("hours_query");
      expect(result.confidence).toBe("high");
      expect(result.responseText).toContain("Closed now");
      vi.useRealTimers();
    });

    it("should detect business is open during cross-midnight schedule", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 30, 23, 0)); // Friday 11:00 PM

      (classifyIntent as Mock).mockReturnValue({
        intent: "hours_query",
        confidence: "high",
      });
      (getBusinessHours as Mock).mockResolvedValue({
        friday: { open: "18:00", close: "02:00" },
      });

      const result = await processMessage(tenantId, "ម៉ org បើក");

      expect(result.intent).toBe("hours_query");
      expect(result.confidence).toBe("high");
      expect(result.responseText).toBe("Hours response");
      vi.useRealTimers();
    });

    it("should detect open in yesterday cross-midnight window", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 31, 1, 0)); // Saturday 1:00 AM

      (classifyIntent as Mock).mockReturnValue({
        intent: "hours_query",
        confidence: "high",
      });
      (getBusinessHours as Mock).mockResolvedValue({
        friday: { open: "18:00", close: "02:00" },
      });

      const result = await processMessage(tenantId, "ម៉ org បើក");

      expect(result.intent).toBe("hours_query");
      expect(result.confidence).toBe("high");
      expect(result.responseText).toBe("Hours response");
      vi.useRealTimers();
    });
  });

  describe("error handling", () => {
    it("should return error template on engine error (Story 4.6)", async () => {
      (classifyIntent as Mock).mockImplementation(() => {
        throw new Error("Classification failed");
      });

      const result = await processMessage(tenantId, "test message");

      expect(result.confidence).toBe("low");
      expect(result.intent).toBe("general_faq");
      expect(result.responseText).toBe("Error response");
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR] [BOT] Engine processing failed:",
        expect.objectContaining({ tenantId })
      );
    });
  });
});
