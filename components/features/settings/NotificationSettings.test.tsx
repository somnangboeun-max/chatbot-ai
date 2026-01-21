/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationSettings } from "./NotificationSettings";

// Mock the actions
vi.mock("@/actions/notifications", () => ({
  updateNotificationSettings: vi.fn(() =>
    Promise.resolve({ success: true, data: {} })
  ),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { updateNotificationSettings } from "@/actions/notifications";
import { toast } from "sonner";

describe("NotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with none method selected", () => {
    render(
      <NotificationSettings currentMethod="none" currentTarget={null} />
    );

    expect(screen.getByText("Staff Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("No notifications")).toBeChecked();
  });

  it("renders with telegram method and shows input", () => {
    render(
      <NotificationSettings
        currentMethod="telegram"
        currentTarget="123456789"
      />
    );

    expect(screen.getByLabelText("Telegram")).toBeChecked();
    expect(
      screen.getByLabelText("Telegram Chat ID or Username")
    ).toHaveValue("123456789");
  });

  it("renders with sms method and shows phone input", () => {
    render(
      <NotificationSettings
        currentMethod="sms"
        currentTarget="+85512345678"
      />
    );

    expect(screen.getByLabelText("SMS (costs may apply)")).toBeChecked();
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+85512345678");
  });

  it("hides input fields when none is selected", () => {
    render(
      <NotificationSettings currentMethod="none" currentTarget={null} />
    );

    expect(
      screen.queryByLabelText("Telegram Chat ID or Username")
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Phone Number")).not.toBeInTheDocument();
  });

  it("shows test button when method is configured", () => {
    render(
      <NotificationSettings
        currentMethod="telegram"
        currentTarget="123456789"
      />
    );

    expect(
      screen.getByRole("button", { name: /send test message/i })
    ).toBeInTheDocument();
  });

  it("hides test button when method is none", () => {
    render(
      <NotificationSettings currentMethod="none" currentTarget={null} />
    );

    expect(
      screen.queryByRole("button", { name: /send test/i })
    ).not.toBeInTheDocument();
  });

  it("disables test button when target is empty", () => {
    render(
      <NotificationSettings currentMethod="telegram" currentTarget="" />
    );

    const testButton = screen.getByRole("button", {
      name: /send test message/i,
    });
    expect(testButton).toBeDisabled();
  });

  it("saves settings when switching to none", async () => {
    render(
      <NotificationSettings currentMethod="telegram" currentTarget="123456789" />
    );

    const noneRadio = screen.getByLabelText("No notifications");
    fireEvent.click(noneRadio);

    await waitFor(() => {
      expect(updateNotificationSettings).toHaveBeenCalled();
    });
  });

  it("does not save immediately when switching to telegram with empty target", async () => {
    render(
      <NotificationSettings currentMethod="none" currentTarget={null} />
    );

    const telegramRadio = screen.getByLabelText("Telegram");
    fireEvent.click(telegramRadio);

    // Should NOT have been called yet - waits for user to enter target
    expect(updateNotificationSettings).not.toHaveBeenCalled();
  });

  it("shows success toast on successful save", async () => {
    vi.mocked(updateNotificationSettings).mockResolvedValueOnce({
      success: true,
      data: { notification_method: null, notification_target: null },
    });

    render(
      <NotificationSettings currentMethod="telegram" currentTarget="123456789" />
    );

    // Switch to none triggers immediate save
    const noneRadio = screen.getByLabelText("No notifications");
    fireEvent.click(noneRadio);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Notification settings saved");
    });
  });

  it("shows error toast on failed save", async () => {
    vi.mocked(updateNotificationSettings).mockResolvedValueOnce({
      success: false,
      error: { code: "SERVER_ERROR", message: "Save failed" },
    });

    render(
      <NotificationSettings currentMethod="telegram" currentTarget="123456789" />
    );

    // Switch to none triggers immediate save
    const noneRadio = screen.getByLabelText("No notifications");
    fireEvent.click(noneRadio);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Save failed");
    });
  });

  it("clears target when switching methods", async () => {
    render(
      <NotificationSettings
        currentMethod="telegram"
        currentTarget="123456789"
      />
    );

    const smsRadio = screen.getByLabelText("SMS (costs may apply)");
    fireEvent.click(smsRadio);

    await waitFor(() => {
      const phoneInput = screen.getByLabelText("Phone Number");
      expect(phoneInput).toHaveValue("");
    });
  });

  it("saves on input blur", async () => {
    render(
      <NotificationSettings currentMethod="telegram" currentTarget="" />
    );

    const input = screen.getByLabelText("Telegram Chat ID or Username");
    fireEvent.change(input, { target: { value: "987654321" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(updateNotificationSettings).toHaveBeenCalled();
    });
  });

  it("shows helper text for Telegram", () => {
    render(
      <NotificationSettings currentMethod="telegram" currentTarget="" />
    );

    expect(screen.getByText(/@userinfobot/)).toBeInTheDocument();
  });

  it("shows helper text for SMS", () => {
    render(
      <NotificationSettings currentMethod="sms" currentTarget="" />
    );

    expect(screen.getByText(/SMS charges may apply/)).toBeInTheDocument();
  });
});
