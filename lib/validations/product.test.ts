import { describe, it, expect } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  productSchema,
  currencyEnum,
} from "./product";

describe("Product Validation Schemas", () => {
  describe("currencyEnum", () => {
    it("accepts USD", () => {
      expect(currencyEnum.parse("USD")).toBe("USD");
    });

    it("accepts KHR", () => {
      expect(currencyEnum.parse("KHR")).toBe("KHR");
    });

    it("rejects invalid currency", () => {
      expect(() => currencyEnum.parse("EUR")).toThrow();
    });
  });

  describe("createProductSchema", () => {
    it("validates valid product data", () => {
      const result = createProductSchema.safeParse({
        name: "Lok Lak",
        price: 5.0,
        currency: "USD",
      });
      expect(result.success).toBe(true);
    });

    it("accepts number price", () => {
      const result = createProductSchema.safeParse({
        name: "Amok",
        price: 4.5,
        currency: "USD",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(4.5);
      }
    });

    it("requires currency field", () => {
      const result = createProductSchema.safeParse({
        name: "Fried Rice",
        price: 3.5,
      });
      // Currency is required, so this should fail
      expect(result.success).toBe(false);
    });

    it("accepts USD currency", () => {
      const result = createProductSchema.safeParse({
        name: "Fried Rice",
        price: 3.5,
        currency: "USD",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("USD");
      }
    });

    it("rejects empty name", () => {
      const result = createProductSchema.safeParse({
        name: "",
        price: 5.0,
        currency: "USD",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name over 100 characters", () => {
      const result = createProductSchema.safeParse({
        name: "a".repeat(101),
        price: 5.0,
        currency: "USD",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative price", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        price: -5.0,
        currency: "USD",
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero price", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        price: 0,
        currency: "USD",
      });
      expect(result.success).toBe(false);
    });

    it("rejects price over 999999.99", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        price: 1000000,
        currency: "USD",
      });
      expect(result.success).toBe(false);
    });

    it("accepts KHR currency", () => {
      const result = createProductSchema.safeParse({
        name: "Pho",
        price: 15000,
        currency: "KHR",
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from name", () => {
      const result = createProductSchema.safeParse({
        name: "  Beef Stew  ",
        price: 8.0,
        currency: "USD",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Beef Stew");
      }
    });
  });

  describe("updateProductSchema", () => {
    it("validates partial update with name only", () => {
      const result = updateProductSchema.safeParse({
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
    });

    it("validates partial update with price only", () => {
      const result = updateProductSchema.safeParse({
        price: 10.0,
      });
      expect(result.success).toBe(true);
    });

    it("validates partial update with currency only", () => {
      const result = updateProductSchema.safeParse({
        currency: "KHR",
      });
      expect(result.success).toBe(true);
    });

    it("validates full update", () => {
      const result = updateProductSchema.safeParse({
        name: "New Name",
        price: 15.0,
        currency: "KHR",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid price in partial update", () => {
      const result = updateProductSchema.safeParse({
        price: -5.0,
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty object for no updates", () => {
      const result = updateProductSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("productSchema (full)", () => {
    it("validates complete product", () => {
      const result = productSchema.safeParse({
        name: "Test Product",
        price: 5.0,
        currency: "USD",
      });
      expect(result.success).toBe(true);
    });

    it("requires all fields", () => {
      const result = productSchema.safeParse({
        name: "Test Product",
      });
      expect(result.success).toBe(false);
    });
  });
});
