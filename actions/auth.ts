"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signupSchema,
  emailSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";
import { env } from "@/lib/env";

export async function signUp(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const validated = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const supabase = await createClient();

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (authError) {
    console.error("[ERROR] [AUTH] Signup failed:", {
      email: validated.data.email,
      error: authError.message,
    });

    // Handle specific errors
    if (authError.message.includes("already registered")) {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: "This email is already registered",
        },
      };
    }

    if (authError.message.includes("rate limit")) {
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many attempts. Please try again later.",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Unable to create account. Please try again.",
      },
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "User creation failed unexpectedly.",
      },
    };
  }

  // 2. Create business record for the new user
  // Use admin client to bypass RLS for initial creation (user has no tenant_id yet)
  const adminSupabase = createAdminClient();

  // Use email prefix as initial business name, or default
  const businessName = validated.data.email.split("@")[0] || "My Business";

  const { data: business, error: businessError } = await adminSupabase
    .from("businesses")
    .insert({
      owner_id: authData.user.id,
      name: businessName,
    })
    .select()
    .single();

  if (businessError) {
    console.error("[ERROR] [AUTH] Business creation failed:", {
      userId: authData.user.id,
      error: businessError.message,
    });
    // Note: User is created but business failed - this is a partial failure
    // The user can still verify email, and we'll handle missing business in callback
  }

  // 3. Set tenant_id in user's app_metadata (JWT claim)
  if (business) {
    const { error: claimError } = await adminSupabase.auth.admin.updateUserById(
      authData.user.id,
      {
        app_metadata: { tenant_id: business.id },
      }
    );

    if (claimError) {
      console.error("[ERROR] [AUTH] Failed to set tenant_id claim:", {
        userId: authData.user.id,
        businessId: business.id,
        error: claimError.message,
      });
    } else {
      console.info("[INFO] [AUTH] User and business created:", {
        userId: authData.user.id,
        businessId: business.id,
      });
    }
  }

  return {
    success: true,
    data: { message: "Check your email for a confirmation link." },
  };
}

export async function resendVerificationEmail(
  email: string
): Promise<ActionResult<{ message: string }>> {
  const validated = emailSchema.safeParse(email);

  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validated.error.issues[0]?.message ?? "Invalid email",
      },
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: validated.data,
  });

  if (error) {
    console.error("[ERROR] [AUTH] Resend verification failed:", {
      email: validated.data,
      error: error.message,
    });

    if (error.message.includes("rate limit")) {
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many attempts. Please try again later.",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Unable to resend verification email. Please try again.",
      },
    };
  }

  console.info("[INFO] [AUTH] Verification email resent:", { email: validated.data });

  return {
    success: true,
    data: { message: "Verification email sent. Please check your inbox." },
  };
}

export async function signIn(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    console.error("[ERROR] [AUTH] Login failed:", {
      email: validated.data.email,
      error: error.message,
      code: error.code,
    });

    // Security: Don't reveal whether email exists
    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      };
    }

    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Please verify your email before logging in",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Unable to sign in. Please try again.",
      },
    };
  }

  console.info("[INFO] [AUTH] User logged in:", {
    email: validated.data.email,
    userId: data.user?.id,
  });

  return {
    success: true,
    data: { message: "Login successful" },
  };
}

export async function signOut(): Promise<ActionResult<{ message: string }>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[ERROR] [AUTH] Sign out failed:", {
      error: error.message,
    });

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Unable to sign out. Please try again.",
      },
    };
  }

  console.info("[INFO] [AUTH] User signed out");

  redirect("/auth/login");
}

export async function requestPasswordReset(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    validated.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?type=recovery`,
    }
  );

  // SECURITY: Always return success message even if email doesn't exist
  // This prevents email enumeration attacks
  if (error) {
    // Note: Don't log email addresses to prevent PII in logs
    console.error("[ERROR] [AUTH] Password reset request failed:", {
      error: error.message,
    });
    // Still return success to prevent email enumeration
  }

  // Log without PII - just indicate a request was made
  console.info("[INFO] [AUTH] Password reset requested");

  return {
    success: true,
    data: { message: "Check your email for reset instructions" },
  };
}

export async function updatePassword(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const validated = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const supabase = await createClient();

  // Check if user is authenticated (from recovery flow)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[ERROR] [AUTH] Password update - no authenticated user");
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Your reset link has expired. Please request a new one.",
      },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    console.error("[ERROR] [AUTH] Password update failed:", {
      userId: user.id,
      error: error.message,
    });
    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Unable to update password. Please try again.",
      },
    };
  }

  // Sign out ALL sessions after password update (security best practice)
  // Using 'global' scope ensures all devices/sessions are invalidated
  await supabase.auth.signOut({ scope: 'global' });

  console.info("[INFO] [AUTH] Password updated successfully:", {
    userId: user.id,
  });

  return {
    success: true,
    data: { message: "Password updated successfully" },
  };
}
