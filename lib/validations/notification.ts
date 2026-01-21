import { z } from "zod";

/**
 * Notification Settings Validation Schemas
 *
 * Zod schemas for validating notification settings updates.
 * Used by the notifications settings page for staff alerts configuration.
 */

// Notification method enum
export const notificationMethodEnum = z.enum(["telegram", "sms", "none"]);

// Cambodian phone number validation (starts with +855 or 0, followed by 8-9 digits)
const cambodianPhoneRegex = /^(\+855|0)\d{8,9}$/;

// Telegram chat ID (numeric) or username (@handle)
// Chat IDs can be negative (for groups) or positive (for users)
const telegramTargetRegex = /^(-?\d+|@[a-zA-Z][a-zA-Z0-9_]{4,31})$/;

// Main notification settings schema with conditional validation
export const notificationSettingsSchema = z
  .object({
    notification_method: notificationMethodEnum,
    notification_target: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If method is 'none', target is not required
    if (data.notification_method === "none") {
      return;
    }

    // If method is set, target is required
    if (!data.notification_target || data.notification_target.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.notification_method === "telegram"
            ? "Telegram chat ID or username is required"
            : "Phone number is required",
        path: ["notification_target"],
      });
      return;
    }

    // Validate format based on method
    if (data.notification_method === "telegram") {
      if (!telegramTargetRegex.test(data.notification_target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Enter a valid Telegram chat ID (number) or username (@handle)",
          path: ["notification_target"],
        });
      }
    } else if (data.notification_method === "sms") {
      // Strip spaces and dashes for validation (users may enter formatted numbers)
      const normalizedPhone = data.notification_target.replace(/[\s-]/g, "");
      if (!cambodianPhoneRegex.test(normalizedPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid Cambodian phone number (+855... or 0...)",
          path: ["notification_target"],
        });
      }
    }
  });

// Type exports
export type NotificationMethod = z.infer<typeof notificationMethodEnum>;
export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
