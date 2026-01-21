"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notificationSettingsSchema } from "@/lib/validations/notification";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { sendSms } from "@/lib/sms/client";
import type { ActionResult, Business } from "@/types";

type NotificationSettings = Pick<
  Business,
  "notification_method" | "notification_target"
>;

/**
 * Update Notification Settings
 *
 * Updates the notification method and target for staff alerts.
 * Auto-saves on change from the settings page.
 */
export async function updateNotificationSettings(
  formData: FormData
): Promise<ActionResult<NotificationSettings>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  const rawData = Object.fromEntries(formData);
  const validated = notificationSettingsSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid notification settings",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  // If method is 'none', clear the target and set notification_method to null
  const notification_method =
    validated.data.notification_method === "none"
      ? null
      : validated.data.notification_method;
  const notification_target =
    validated.data.notification_method === "none"
      ? null
      : validated.data.notification_target;

  const { data, error } = await supabase
    .from("businesses")
    .update({
      notification_method,
      notification_target,
    })
    .eq("id", tenantId)
    .select("notification_method, notification_target")
    .single();

  if (error) {
    console.error("[ERROR] [NOTIFICATIONS] Update failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update notification settings" },
    };
  }

  console.info("[INFO] [NOTIFICATIONS] Updated:", {
    tenantId,
    method: validated.data.notification_method,
  });
  revalidatePath("/settings/notifications");

  return { success: true, data };
}

/**
 * Send Test Notification
 *
 * Sends a test notification using the currently configured method.
 * Used to verify notification settings are working correctly.
 */
export async function sendTestNotification(): Promise<
  ActionResult<{ sent: true }>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  // Fetch current notification settings
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("name, notification_method, notification_target")
    .eq("id", tenantId)
    .single();

  if (fetchError || !business) {
    console.error("[ERROR] [NOTIFICATIONS] Fetch failed:", {
      tenantId,
      error: fetchError?.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch business settings" },
    };
  }

  if (!business.notification_method || !business.notification_target) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Notification method not configured",
      },
    };
  }

  try {
    if (business.notification_method === "telegram") {
      await sendTelegramMessage(
        business.notification_target,
        `🔔 Test notification from <b>${business.name}</b>\n\nThis is a test message to confirm your notification settings are working correctly.`
      );
    } else if (business.notification_method === "sms") {
      // SMS placeholder - uses client that logs for MVP
      await sendSms({
        to: business.notification_target,
        body: `Test notification from ${business.name}. Your notification settings are working correctly.`,
      });
    }

    console.info("[INFO] [NOTIFICATIONS] Test sent:", {
      tenantId,
      method: business.notification_method,
    });

    return { success: true, data: { sent: true } };
  } catch (error) {
    console.error("[ERROR] [NOTIFICATIONS] Test send failed:", {
      tenantId,
      method: business.notification_method,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to send test notification" },
    };
  }
}
