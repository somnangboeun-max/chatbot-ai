import { describe, it, expect } from "vitest";
import {
  formatPrice,
  parsePrice,
  toKhmerNumerals,
  getCurrencySymbol,
} from "./formatCurrency";

describe("formatCurrency utilities", () => {
  describe("formatPrice", () => {
    describe("USD formatting", () => {
      it("formats USD with 2 decimal places", () => {
        expect(formatPrice(5.0, "USD")).toBe("$5.00");
      });

      it("formats USD with decimal price", () => {
        expect(formatPrice(4.5, "USD")).toBe("$4.50");
      });

      it("formats USD with cents", () => {
        expect(formatPrice(10.99, "USD")).toBe("$10.99");
      });

      it("formats zero USD", () => {
        expect(formatPrice(0, "USD")).toBe("$0.00");
      });

      it("formats large USD values", () => {
        expect(formatPrice(1234.56, "USD")).toBe("$1234.56");
      });
    });

    describe("KHR formatting", () => {
      it("formats KHR with no decimals", () => {
        expect(formatPrice(20000, "KHR")).toBe("20,000៛");
      });

      it("formats KHR with thousands separators", () => {
        expect(formatPrice(1500000, "KHR")).toBe("1,500,000៛");
      });

      it("formats small KHR values", () => {
        expect(formatPrice(500, "KHR")).toBe("500៛");
      });

      it("rounds KHR to whole numbers", () => {
        expect(formatPrice(15000.5, "KHR")).toBe("15,001៛");
      });

      it("formats zero KHR", () => {
        expect(formatPrice(0, "KHR")).toBe("0៛");
      });
    });

    describe("Khmer numerals option", () => {
      it("formats USD with Khmer numerals", () => {
        expect(formatPrice(5.0, "USD", true)).toBe("$៥.០០");
      });

      it("formats KHR with Khmer numerals", () => {
        expect(formatPrice(20000, "KHR", true)).toBe("២០,០០០៛");
      });
    });

    describe("edge cases", () => {
      it("handles negative numbers as zero", () => {
        expect(formatPrice(-5, "USD")).toBe("$0.00");
        expect(formatPrice(-5, "KHR")).toBe("0៛");
      });

      it("handles Infinity as zero", () => {
        expect(formatPrice(Infinity, "USD")).toBe("$0.00");
      });

      it("handles NaN as zero", () => {
        expect(formatPrice(NaN, "USD")).toBe("$0.00");
      });
    });
  });

  describe("parsePrice", () => {
    it("parses USD format", () => {
      expect(parsePrice("$5.00")).toBe(5);
    });

    it("parses USD with cents", () => {
      expect(parsePrice("$10.99")).toBe(10.99);
    });

    it("parses KHR format", () => {
      expect(parsePrice("20,000៛")).toBe(20000);
    });

    it("parses KHR with thousands separators", () => {
      expect(parsePrice("1,500,000៛")).toBe(1500000);
    });

    it("parses plain number string", () => {
      expect(parsePrice("123.45")).toBe(123.45);
    });

    it("parses Khmer numerals", () => {
      expect(parsePrice("១២៣៛")).toBe(123);
    });

    it("returns 0 for invalid input", () => {
      expect(parsePrice("abc")).toBe(0);
      expect(parsePrice("")).toBe(0);
    });
  });

  describe("toKhmerNumerals", () => {
    it("converts Arabic to Khmer numerals", () => {
      expect(toKhmerNumerals("123")).toBe("១២៣");
    });

    it("converts all digits", () => {
      expect(toKhmerNumerals("0123456789")).toBe("០១២៣៤៥៦៧៨៩");
    });

    it("preserves non-digit characters", () => {
      expect(toKhmerNumerals("1,234.56")).toBe("១,២៣៤.៥៦");
    });

    it("handles numbers directly", () => {
      expect(toKhmerNumerals(12345)).toBe("១២៣៤៥");
    });
  });

  describe("getCurrencySymbol", () => {
    it("returns $ for USD", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
    });

    it("returns ៛ for KHR", () => {
      expect(getCurrencySymbol("KHR")).toBe("៛");
    });
  });
});
