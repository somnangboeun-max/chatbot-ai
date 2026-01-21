import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Telegram client
vi.mock("@/lib/telegram/client", () => ({
  sendTelegramMessage: vi.fn(() => Promise.resolve()),
}));

// Mock SMS client
vi.mock("@/lib/sms/client", () => ({
  sendSms: vi.fn(() => Promise.resolve()),
}));

// Import after mocks are set up
import {
  updateNotificationSettings,
  sendTestNotification,
} from "./notifications";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { sendSms } from "@/lib/sms/client";

describe("updateNotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const formData = new FormData();
    formData.append("notification_method", "telegram");
    formData.append("notification_target", "123456789");

    const result = await updateNotificationSettings(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: {},
        },
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("notification_method", "telegram");
    formData.append("notification_target", "123456789");

    const result = await updateNotificationSettings(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns VALIDATION_ERROR for invalid data", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: { tenant_id: "tenant-123" },
        },
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("notification_method", "telegram");
    // Missing notification_target

    const result = await updateNotificationSettings(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns success when settings are valid", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: { tenant_id: "tenant-123" },
        },
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        notification_method: "telegram",
        notification_target: "123456789",
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("notification_method", "telegram");
    formData.append("notification_target", "123456789");

    const result = await updateNotificationSettings(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notification_method).toBe("telegram");
    }
  });

  it("sets notification_method to null when method is none", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: { tenant_id: "tenant-123" },
        },
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        notification_method: null,
        notification_target: null,
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("notification_method", "none");

    const result = await updateNotificationSettings(formData);

    expect(result.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      notification_method: null,
      notification_target: null,
    });
  });
});

describe("sendTestNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const result = await sendTestNotification();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns VALIDATION_ERROR when notification not configured", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: { tenant_id: "tenant-123" },
        },
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        name: "Test Business",
        notification_method: null,
        notification_target: null,
      },
      error: null,
    });

    const result = await sendTestNotification();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toBe("Notification method not configured");
    }
  });

  it("sends Telegram notification successfully", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: { tenant_id: "tenant-123" },
        },
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        name: "Test Business",
        notification_method: "telegram",
        notification_target: "123456789",
      },
      error: null,
    });

    const result = await sendTestNotification();

    expect(result.success).toBe(true);
    expect(sendTelegramMessage).toHaveBeenCalledWith(
      "123456789",
      expect.stringContaining("Test notification")
    );
  });

  it("calls sendSms for SMS test notification", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          app_metadata: { tenant_id: "tenant-123" },
        },
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        name: "Test Business",
        notification_method: "sms",
        notification_target: "+85512345678",
      },
      error: null,
    });

    const result = await sendTestNotification();

    expect(result.success).toBe(true);
    expect(sendSms).toHaveBeenCalledWith({
      to: "+85512345678",
      body: expect.stringContaining("Test notification"),
    });
  });
});
