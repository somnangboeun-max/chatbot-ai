/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FacebookConnectionCard } from "./FacebookConnectionCard";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: vi.fn(),
  }),
}));

// Mock the server action
const mockDisconnect = vi.fn().mockResolvedValue({ success: true, data: null });
vi.mock("@/actions/facebook", () => ({
  disconnectFacebookPage: (...args: unknown[]) => mockDisconnect(...args),
}));

// Mock sonner toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToast.success(...args),
    error: (...args: unknown[]) => mockToast.error(...args),
  },
}));

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn(() => "Jan 28, 2026"),
}));

describe("FacebookConnectionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when not connected", () => {
    const disconnectedStatus = {
      isConnected: false,
      pageId: null,
      pageName: null,
      pageAvatarUrl: null,
      connectedAt: null,
    };

    it("renders connect button", () => {
      render(<FacebookConnectionCard status={disconnectedStatus} />);

      expect(screen.getByText("Connect Facebook Page")).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<FacebookConnectionCard status={disconnectedStatus} />);

      expect(
        screen.getByText(/Connect your Facebook Business Page/)
      ).toBeInTheDocument();
    });

    it("connect button links to OAuth route", () => {
      render(<FacebookConnectionCard status={disconnectedStatus} />);

      const link = screen.getByRole("link", { name: /Connect Facebook Page/ });
      expect(link).toHaveAttribute("href", "/api/auth/facebook");
    });
  });

  describe("when connected", () => {
    const connectedStatus = {
      isConnected: true,
      pageId: "page-123",
      pageName: "My Business Page",
      pageAvatarUrl: "https://example.com/avatar.jpg",
      connectedAt: "2026-01-28T00:00:00Z",
    };

    it("renders page name", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      expect(screen.getByText("My Business Page")).toBeInTheDocument();
    });

    it("renders connected date", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    it("renders disconnect button", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      expect(screen.getByText("Disconnect")).toBeInTheDocument();
    });

    it("shows confirmation dialog when disconnect is clicked", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      const disconnectButton = screen.getByText("Disconnect");
      fireEvent.click(disconnectButton);

      expect(screen.getByText("Disconnect Facebook Page?")).toBeInTheDocument();
    });

    it("shows page name in confirmation dialog", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      const disconnectButton = screen.getByText("Disconnect");
      fireEvent.click(disconnectButton);

      expect(
        screen.getByText(/stop the chatbot from receiving messages from My Business Page/)
      ).toBeInTheDocument();
    });

    it("renders avatar with fallback", () => {
      const statusWithoutAvatar = {
        ...connectedStatus,
        pageAvatarUrl: null,
      };

      render(<FacebookConnectionCard status={statusWithoutAvatar} />);

      // Avatar fallback shows first letter
      expect(screen.getByText("M")).toBeInTheDocument();
    });

    it("calls disconnectFacebookPage when confirmation button is clicked", async () => {
      mockDisconnect.mockResolvedValue({ success: true, data: null });

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog
      fireEvent.click(screen.getByText("Disconnect"));

      // Click confirm in dialog - the AlertDialogAction has text "Disconnect"
      const dialogButtons = screen.getAllByText("Disconnect");
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });

    it("shows success toast on successful disconnect", async () => {
      mockDisconnect.mockResolvedValue({ success: true, data: null });

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText("Disconnect"));
      const dialogButtons = screen.getAllByText("Disconnect");
      fireEvent.click(dialogButtons[dialogButtons.length - 1]);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Facebook Page disconnected");
      });
    });

    it("calls router.refresh on successful disconnect", async () => {
      mockDisconnect.mockResolvedValue({ success: true, data: null });

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText("Disconnect"));
      const dialogButtons = screen.getAllByText("Disconnect");
      fireEvent.click(dialogButtons[dialogButtons.length - 1]);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows error toast on disconnect failure", async () => {
      mockDisconnect.mockResolvedValue({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to disconnect" },
      });

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText("Disconnect"));
      const dialogButtons = screen.getAllByText("Disconnect");
      fireEvent.click(dialogButtons[dialogButtons.length - 1]);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to disconnect");
      });
    });

    it("shows error toast when page already disconnected (NOT_FOUND)", async () => {
      mockDisconnect.mockResolvedValue({
        success: false,
        error: { code: "NOT_FOUND", message: "No Facebook connection found" },
      });

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText("Disconnect"));
      const dialogButtons = screen.getAllByText("Disconnect");
      fireEvent.click(dialogButtons[dialogButtons.length - 1]);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("No Facebook connection found");
      });
    });

    it("shows fallback error toast on unexpected exception", async () => {
      mockDisconnect.mockRejectedValue(new Error("Network failure"));

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText("Disconnect"));
      const dialogButtons = screen.getAllByText("Disconnect");
      fireEvent.click(dialogButtons[dialogButtons.length - 1]);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to disconnect. Please try again.");
      });
    });

    it("shows loading state during disconnect operation", async () => {
      // Make disconnect hang to test loading state
      let resolveDisconnect: (value: unknown) => void;
      mockDisconnect.mockImplementation(
        () => new Promise((resolve) => { resolveDisconnect = resolve; })
      );

      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog and confirm
      fireEvent.click(screen.getByText("Disconnect"));
      const dialogButtons = screen.getAllByText("Disconnect");
      fireEvent.click(dialogButtons[dialogButtons.length - 1]);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Disconnecting...")).toBeInTheDocument();
      });

      // Resolve the promise to clean up
      resolveDisconnect!({ success: true, data: null });
    });

    it("has Cancel and Disconnect buttons in confirmation dialog", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      // Open dialog
      fireEvent.click(screen.getByText("Disconnect"));

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      // Dialog should have the confirm "Disconnect" button
      const disconnectButtons = screen.getAllByText("Disconnect");
      expect(disconnectButtons.length).toBeGreaterThanOrEqual(2); // trigger + dialog action
    });

    it("disconnect button uses destructive styling", () => {
      render(<FacebookConnectionCard status={connectedStatus} />);

      // The trigger button (not the dialog action)
      const triggerButton = screen.getByText("Disconnect").closest("button");
      expect(triggerButton).toHaveClass("text-destructive");
    });
  });
});
