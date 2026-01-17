"use server";

import { createClient } from "@/lib/supabase/server";
import { signupSchema, emailSchema, loginSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

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

  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    console.error("[ERROR] [AUTH] Signup failed:", {
      email: validated.data.email,
      error: error.message,
    });

    // Handle specific errors
    if (error.message.includes("already registered")) {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: "This email is already registered",
        },
      };
    }

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
        message: "Unable to create account. Please try again.",
      },
    };
  }

  console.info("[INFO] [AUTH] User signup initiated:", {
    email: validated.data.email,
    userId: data.user?.id,
  });

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
