import { describe, it, expect } from "vitest";
import {
  businessInfoSchema,
  businessHoursSchema,
  dayHoursSchema,
} from "./business";

describe("businessInfoSchema", () => {
  it("validates valid business info", () => {
    const result = businessInfoSchema.safeParse({
      name: "Test Business",
      address: "123 Test Street",
      city: "Phnom Penh",
      landmarks: "Near Central Market",
      phone: "012345678",
    });

    expect(result.success).toBe(true);
  });

  it("requires business name", () => {
    const result = businessInfoSchema.safeParse({
      name: "",
      address: "123 Test Street",
    });

    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = businessInfoSchema.safeParse({
      name: "a".repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it("validates Cambodian phone numbers", () => {
    const validPhones = [
      "012345678",
      "0961234567",
      "077123456",
      "855123456789",
      "+855123456789",
    ];

    validPhones.forEach((phone) => {
      const result = businessInfoSchema.safeParse({
        name: "Test",
        phone,
      });
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid phone numbers", () => {
    const invalidPhones = [
      "123456", // Too short
      "1234567890123456", // Too long
      "abc12345", // Contains letters
    ];

    invalidPhones.forEach((phone) => {
      const result = businessInfoSchema.safeParse({
        name: "Test",
        phone,
      });
      expect(result.success).toBe(false);
    });
  });

  it("allows empty phone number", () => {
    const result = businessInfoSchema.safeParse({
      name: "Test",
      phone: "",
    });

    expect(result.success).toBe(true);
  });

  it("allows optional fields to be undefined", () => {
    const result = businessInfoSchema.safeParse({
      name: "Test Business",
    });

    expect(result.success).toBe(true);
  });
});

describe("dayHoursSchema", () => {
  it("validates valid day hours", () => {
    const result = dayHoursSchema.safeParse({
      open: "09:00",
      close: "18:00",
    });

    expect(result.success).toBe(true);
  });

  it("validates closed days", () => {
    const result = dayHoursSchema.safeParse({
      closed: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid time format", () => {
    const result = dayHoursSchema.safeParse({
      open: "9:00", // Should be 09:00
      close: "18:00",
    });

    expect(result.success).toBe(false);
  });

  it("allows overnight hours (e.g., nightclub 22:00 to 02:00)", () => {
    const result = dayHoursSchema.safeParse({
      open: "22:00",
      close: "02:00",
    });

    expect(result.success).toBe(true);
  });

  it("rejects same open and close time", () => {
    const result = dayHoursSchema.safeParse({
      open: "09:00",
      close: "09:00",
    });

    expect(result.success).toBe(false);
  });

  it("requires both open and close when not closed", () => {
    const result = dayHoursSchema.safeParse({
      open: "09:00",
    });

    expect(result.success).toBe(false);
  });

  it("allows missing times when closed", () => {
    const result = dayHoursSchema.safeParse({
      closed: true,
      open: undefined,
      close: undefined,
    });

    expect(result.success).toBe(true);
  });
});

describe("businessHoursSchema", () => {
  const validHours = {
    monday: { open: "09:00", close: "18:00" },
    tuesday: { open: "09:00", close: "18:00" },
    wednesday: { open: "09:00", close: "18:00" },
    thursday: { open: "09:00", close: "18:00" },
    friday: { open: "09:00", close: "18:00" },
    saturday: { open: "10:00", close: "16:00" },
    sunday: { closed: true },
  };

  it("validates complete business hours", () => {
    const result = businessHoursSchema.safeParse(validHours);

    expect(result.success).toBe(true);
  });

  it("requires all days", () => {
    const incompleteHours = {
      monday: { open: "09:00", close: "18:00" },
      // Missing other days
    };

    const result = businessHoursSchema.safeParse(incompleteHours);

    expect(result.success).toBe(false);
  });

  it("validates each day individually", () => {
    const invalidHours = {
      ...validHours,
      monday: { open: "09:00", close: "09:00" }, // Invalid: same open and close time
    };

    const result = businessHoursSchema.safeParse(invalidHours);

    expect(result.success).toBe(false);
  });

  it("allows overnight hours for individual days", () => {
    const nightclubHours = {
      ...validHours,
      friday: { open: "22:00", close: "04:00" }, // Overnight hours
      saturday: { open: "22:00", close: "04:00" },
    };

    const result = businessHoursSchema.safeParse(nightclubHours);

    expect(result.success).toBe(true);
  });
});
