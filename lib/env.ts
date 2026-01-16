import { z } from "zod";

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Supabase Admin (optional for Story 1.1, required for webhooks in Story 4.x)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Facebook Messenger (optional for Story 1.1, required for Story 4.x)
  FACEBOOK_VERIFY_TOKEN: z.string().min(1).optional(),
  FACEBOOK_APP_SECRET: z.string().min(1).optional(),

  // Telegram (optional for Story 1.1, required for Story 5.x)
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "[ERROR] [ENV] Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      `Invalid environment variables: ${parsed.error.issues.map((e) => e.message).join(", ")}`
    );
  }

  return parsed.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
