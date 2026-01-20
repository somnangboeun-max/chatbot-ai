import { z } from "zod";

/**
 * Business Settings Validation Schemas
 *
 * Zod schemas for validating business settings updates.
 * Used by the settings page for inline editing.
 */

// Cambodian phone number pattern (same as onboarding)
const cambodiaPhoneRegex =
  /^(\+?855|0)?(1[2-9]|[3-9]\d|7[0-9]|8[1-9]|9[0-9])\d{6,7}$/;

// Business info update schema (all fields optional for partial updates)
export const businessInfoSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be 100 characters or less")
    .trim(),
  address: z.string().max(500, "Address is too long").optional(),
  city: z.string().max(100, "City name is too long").optional(),
  landmarks: z.string().max(200, "Landmarks description is too long").optional(),
  phone: z
    .string()
    .regex(
      cambodiaPhoneRegex,
      "Please enter a valid Cambodian phone number (e.g., 012345678)"
    )
    .optional()
    .or(z.literal("")),
});

export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;

// Schema for a single day's hours
// Supports both regular hours (09:00-18:00) and overnight hours (22:00-02:00)
export const dayHoursSchema = z
  .object({
    open: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format")
      .optional(),
    close: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format")
      .optional(),
    closed: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If closed, no validation needed
      if (data.closed) return true;
      // If not closed, both times must be set
      return !!(data.open && data.close);
    },
    { message: "Please set opening and closing times or mark as closed" }
  )
  .refine(
    (data) => {
      // Skip if closed or times not set
      if (data.closed || !data.open || !data.close) return true;
      // Allow overnight hours (e.g., 22:00 to 02:00 for nightclubs)
      // Only reject if open === close (0 hours open)
      return data.open !== data.close;
    },
    { message: "Opening and closing times cannot be the same" }
  );

export const businessHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
export type DayHoursInput = z.infer<typeof dayHoursSchema>;
