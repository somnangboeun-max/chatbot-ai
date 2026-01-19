import { describe, expect, it } from "vitest";
import {
  businessNameSchema,
  businessHoursSchema,
  locationSchema,
  contactSchema,
  formatTime12Hour,
  defaultBusinessHours,
  DAYS_OF_WEEK,
} from "./onboarding";

describe("Onboarding Validation Schemas", () => {
  describe("businessNameSchema", () => {
    it("accepts valid business names", () => {
      expect(businessNameSchema.safeParse({ name: "Sokha's Noodle House" }).success).toBe(true);
      expect(businessNameSchema.safeParse({ name: "កាហ្វេសុខា" }).success).toBe(true);
      expect(businessNameSchema.safeParse({ name: "A" }).success).toBe(true);
      expect(businessNameSchema.safeParse({ name: "A".repeat(100) }).success).toBe(true);
    });

    it("rejects empty names", () => {
      const result = businessNameSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Business name is required");
      }
    });

    it("rejects names over 100 characters", () => {
      const result = businessNameSchema.safeParse({ name: "A".repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Business name must be 100 characters or less");
      }
    });

    it("trims whitespace", () => {
      const result = businessNameSchema.safeParse({ name: "  My Business  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Business");
      }
    });
  });

  describe("businessHoursSchema", () => {
    it("accepts valid opening hours with times", () => {
      const result = businessHoursSchema.safeParse({
        opening_hours: {
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "10:00", close: "14:00" },
          sunday: { closed: true },
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts days marked as closed", () => {
      const result = businessHoursSchema.safeParse({
        opening_hours: {
          monday: { closed: true },
          tuesday: { closed: true },
          wednesday: { closed: true },
          thursday: { closed: true },
          friday: { closed: true },
          saturday: { closed: true },
          sunday: { closed: true },
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects days with missing open time (when not closed)", () => {
      const result = businessHoursSchema.safeParse({
        opening_hours: {
          monday: { close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { closed: true },
        },
      });
      expect(result.success).toBe(false);
    });

    it("accepts default business hours", () => {
      const result = businessHoursSchema.safeParse({
        opening_hours: defaultBusinessHours,
      });
      expect(result.success).toBe(true);
    });

    it("rejects close time before open time", () => {
      const result = businessHoursSchema.safeParse({
        opening_hours: {
          monday: { open: "18:00", close: "09:00" }, // Invalid: close before open
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { closed: true },
        },
      });
      expect(result.success).toBe(false);
    });

    it("accepts same open and close time (edge case)", () => {
      // This is technically invalid but we allow it - business can be open for 0 hours
      const result = businessHoursSchema.safeParse({
        opening_hours: {
          monday: { open: "09:00", close: "09:00" },
          tuesday: { closed: true },
          wednesday: { closed: true },
          thursday: { closed: true },
          friday: { closed: true },
          saturday: { closed: true },
          sunday: { closed: true },
        },
      });
      // Same time should fail (close must be AFTER open)
      expect(result.success).toBe(false);
    });
  });

  describe("locationSchema", () => {
    it("accepts valid location data", () => {
      const result = locationSchema.safeParse({
        address: "123 Main Street, Sangkat Boeung Keng Kang",
        city: "Phnom Penh",
        landmarks: "Near Central Market",
      });
      expect(result.success).toBe(true);
    });

    it("accepts Khmer addresses", () => {
      const result = locationSchema.safeParse({
        address: "ផ្ទះលេខ ១២៣ ផ្លូវ ១២៨",
        city: "ភ្នំពេញ",
      });
      expect(result.success).toBe(true);
    });

    it("allows optional landmarks", () => {
      const result = locationSchema.safeParse({
        address: "123 Main Street",
        city: "Phnom Penh",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing address", () => {
      const result = locationSchema.safeParse({
        address: "",
        city: "Phnom Penh",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Street address is required");
      }
    });

    it("rejects missing city", () => {
      const result = locationSchema.safeParse({
        address: "123 Main Street",
        city: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("City/District is required");
      }
    });
  });

  describe("contactSchema (Cambodian phone validation)", () => {
    it("accepts valid Cambodian mobile numbers", () => {
      const validNumbers = [
        "012345678",    // 012 prefix
        "0961234567",   // 096 prefix
        "0771234567",   // 077 prefix
        "0881234567",   // 088 prefix
        "0151234567",   // 015 prefix
      ];

      validNumbers.forEach((phone) => {
        const result = contactSchema.safeParse({ phone });
        expect(result.success).toBe(true);
      });
    });

    it("accepts numbers with country code", () => {
      const validNumbers = [
        "855123456789",   // Without +
        "+855123456789",  // With +
      ];

      validNumbers.forEach((phone) => {
        const result = contactSchema.safeParse({ phone });
        expect(result.success).toBe(true);
      });
    });

    it("accepts numbers without leading 0", () => {
      const result = contactSchema.safeParse({ phone: "123456789" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      const invalidNumbers = [
        "12345",        // Too short
        "abc123456",    // Contains letters
        "00012345678",  // Invalid prefix
      ];

      invalidNumbers.forEach((phone) => {
        const result = contactSchema.safeParse({ phone });
        expect(result.success).toBe(false);
      });
    });

    it("rejects empty phone number", () => {
      const result = contactSchema.safeParse({ phone: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Phone number is required");
      }
    });
  });

  describe("formatTime12Hour", () => {
    it("formats morning times correctly", () => {
      expect(formatTime12Hour("09:00")).toBe("9:00 AM");
      expect(formatTime12Hour("09:30")).toBe("9:30 AM");
      expect(formatTime12Hour("11:45")).toBe("11:45 AM");
    });

    it("formats afternoon times correctly", () => {
      expect(formatTime12Hour("12:00")).toBe("12:00 PM");
      expect(formatTime12Hour("14:30")).toBe("2:30 PM");
      expect(formatTime12Hour("18:00")).toBe("6:00 PM");
    });

    it("formats midnight correctly", () => {
      expect(formatTime12Hour("00:00")).toBe("12:00 AM");
    });

    it("formats noon correctly", () => {
      expect(formatTime12Hour("12:00")).toBe("12:00 PM");
    });
  });

  describe("DAYS_OF_WEEK constant", () => {
    it("contains all 7 days", () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
    });

    it("starts with monday", () => {
      expect(DAYS_OF_WEEK[0]).toBe("monday");
    });

    it("ends with sunday", () => {
      expect(DAYS_OF_WEEK[6]).toBe("sunday");
    });
  });
});
