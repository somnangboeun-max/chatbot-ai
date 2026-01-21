/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestNotificationButton } from "./TestNotificationButton";

// Mock the actions
vi.mock("@/actions/notifications", () => ({
  sendTestNotification: vi.fn(() =>
    Promise.resolve({ success: true, data: { sent: true } })
  ),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { sendTestNotification } from "@/actions/notifications";
import { toast } from "sonner";

describe("TestNotificationButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders telegram test button", () => {
    render(<TestNotificationButton disabled={false} method="telegram" />);

    expect(
      screen.getByRole("button", { name: /send test message/i })
    ).toBeInTheDocument();
  });

  it("renders sms test button", () => {
    render(<TestNotificationButton disabled={false} method="sms" />);

    expect(
      screen.getByRole("button", { name: /send test sms/i })
    ).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<TestNotificationButton disabled={true} method="telegram" />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls sendTestNotification on click", async () => {
    render(<TestNotificationButton disabled={false} method="telegram" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(sendTestNotification).toHaveBeenCalled();
    });
  });

  it("shows loading state while sending", async () => {
    vi.mocked(sendTestNotification).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: { sent: true } }), 100)
        )
    );

    render(<TestNotificationButton disabled={false} method="telegram" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });
  });

  it("shows success toast on successful send", async () => {
    vi.mocked(sendTestNotification).mockResolvedValueOnce({
      success: true,
      data: { sent: true },
    });

    render(<TestNotificationButton disabled={false} method="telegram" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Test message sent!");
    });
  });

  it("shows success toast with SMS label for SMS method", async () => {
    vi.mocked(sendTestNotification).mockResolvedValueOnce({
      success: true,
      data: { sent: true },
    });

    render(<TestNotificationButton disabled={false} method="sms" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Test SMS sent!");
    });
  });

  it("shows error toast on failed send", async () => {
    vi.mocked(sendTestNotification).mockResolvedValueOnce({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to send" },
    });

    render(<TestNotificationButton disabled={false} method="telegram" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to send");
    });
  });

  it("has minimum 44px touch target", () => {
    render(<TestNotificationButton disabled={false} method="telegram" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("min-h-[44px]");
  });
});
