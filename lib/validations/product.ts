import { z } from "zod";

/**
 * Product Validation Schemas
 *
 * Zod schemas for validating product operations in settings.
 * Used by Server Actions for add, update, and delete operations.
 */

// Currency enum matching database constraint
export const currencyEnum = z.enum(["USD", "KHR"]);

// Product schema for create operations
// Note: currency default is handled by the form, not the schema, to maintain strict typing
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .trim(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(999999.99, "Price is too large"),
  currency: currencyEnum,
});

// Product schema for update operations (partial updates supported)
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .trim()
    .optional(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(999999.99, "Price is too large")
    .optional(),
  currency: currencyEnum.optional(),
});

// Full product schema for validation (matches database row)
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .trim(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(999999.99, "Price is too large"),
  currency: currencyEnum,
});

// Type exports
export type Currency = z.infer<typeof currencyEnum>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductInput = z.infer<typeof productSchema>;
