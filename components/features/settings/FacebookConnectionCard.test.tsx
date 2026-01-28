/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FacebookConnectionCard } from "./FacebookConnectionCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock the server action
vi.mock("@/actions/facebook", () => ({
  disconnectFacebookPage: vi.fn().mockResolvedValue({ success: true, data: null }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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
  });
});
