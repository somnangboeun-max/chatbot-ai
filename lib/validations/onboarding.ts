import { z } from "zod";

/**
 * Onboarding Validation Schemas
 *
 * Zod schemas for validating onboarding form data.
 * Each step has its own schema, with a combined schema for final validation.
 */

// Step 1: Business Name
export const businessNameSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be 100 characters or less")
    .trim(),
});

export type BusinessNameInput = z.infer<typeof businessNameSchema>;

// Step 2: Business Hours
// Schema for a single day's hours
const dayHoursSchema = z
  .object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If closed, no need for open/close times
      if (data.closed) return true;
      // If not closed, both open and close must be set
      return !!(data.open && data.close);
    },
    { message: "Please set opening and closing times or mark as closed" }
  )
  .refine(
    (data) => {
      // Skip validation if closed or times not set
      if (data.closed || !data.open || !data.close) return true;
      // Validate close time is after open time (24-hour format comparison)
      return data.close > data.open;
    },
    { message: "Closing time must be after opening time" }
  );

export const businessHoursSchema = z.object({
  opening_hours: z.object({
    monday: dayHoursSchema,
    tuesday: dayHoursSchema,
    wednesday: dayHoursSchema,
    thursday: dayHoursSchema,
    friday: dayHoursSchema,
    saturday: dayHoursSchema,
    sunday: dayHoursSchema,
  }),
});

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
export type DayHoursInput = z.infer<typeof dayHoursSchema>;

// Step 3: Location
export const locationSchema = z.object({
  address: z
    .string()
    .min(1, "Street address is required")
    .max(500, "Address is too long"),
  city: z
    .string()
    .min(1, "City/District is required")
    .max(100, "City name is too long"),
  landmarks: z.string().max(200, "Landmarks description is too long").optional(),
});

export type LocationInput = z.infer<typeof locationSchema>;

// Step 4: Contact Phone (Cambodian format)
// Cambodian phone number patterns:
// - Mobile: 09x, 07x, 08x, 01x (8-9 digits after prefix)
// - With country code: +855 or 855
// Examples: 012345678, 0961234567, 855123456789, +855123456789
const cambodiaPhoneRegex = /^(\+?855|0)?(1[2-9]|[3-9]\d|7[0-9]|8[1-9]|9[0-9])\d{6,7}$/;

export const contactSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      cambodiaPhoneRegex,
      "Please enter a valid Cambodian phone number (e.g., 012345678)"
    ),
});

export type ContactInput = z.infer<typeof contactSchema>;

// Combined schema for final validation
export const onboardingProfileSchema = z.object({
  name: businessNameSchema.shape.name,
  opening_hours: businessHoursSchema.shape.opening_hours,
  address: locationSchema.shape.address,
  city: locationSchema.shape.city,
  landmarks: locationSchema.shape.landmarks,
  phone: contactSchema.shape.phone,
});

export type OnboardingProfileData = z.infer<typeof onboardingProfileSchema>;

// Default business hours (helper for form initialization)
export const defaultBusinessHours: BusinessHoursInput["opening_hours"] = {
  monday: { open: "09:00", close: "18:00" },
  tuesday: { open: "09:00", close: "18:00" },
  wednesday: { open: "09:00", close: "18:00" },
  thursday: { open: "09:00", close: "18:00" },
  friday: { open: "09:00", close: "18:00" },
  saturday: { open: "09:00", close: "18:00" },
  sunday: { closed: true },
};

// Time options for dropdowns (15-minute intervals)
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  const label = formatTime12Hour(time);
  return { value: time, label };
});

// Format time to 12-hour format for display
export function formatTime12Hour(time24: string): string {
  const parts = time24.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Days of the week (for iteration)
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Step 5: Products & Prices
// Single product validation
export const productSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new products
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .trim(),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .multipleOf(0.01, "Price can have at most 2 decimal places"),
  currency: z.enum(["USD", "KHR"], {
    message: "Please select USD or KHR",
  }),
});

// Products array validation (minimum 1 product required)
export const productsArraySchema = z.object({
  products: z.array(productSchema).min(1, "Please add at least one product"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductsInput = z.infer<typeof productsArraySchema>;

// Currency display helper
export type Currency = "USD" | "KHR";

/**
 * Format price for display
 * USD: $5.00
 * KHR: 20,000៛
 */
export function formatPrice(price: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${price.toFixed(2)}`;
  }
  return `${price.toLocaleString()}៛`;
}
