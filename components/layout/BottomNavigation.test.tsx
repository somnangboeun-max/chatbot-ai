/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNavigation } from "./BottomNavigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";
const mockUsePathname = usePathname as ReturnType<typeof vi.fn>;

describe("BottomNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders 3 navigation tabs", () => {
    render(<BottomNavigation />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    render(<BottomNavigation />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const messagesLink = screen.getByRole("link", { name: /messages/i });
    const settingsLink = screen.getByRole("link", { name: /settings/i });

    expect(dashboardLink).toHaveAttribute("href", "/");
    expect(messagesLink).toHaveAttribute("href", "/messages");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("highlights Dashboard tab when on home route", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomNavigation />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("text-primary");
  });

  it("highlights Messages tab when on messages route", () => {
    mockUsePathname.mockReturnValue("/messages");
    render(<BottomNavigation />);

    const messagesLink = screen.getByRole("link", { name: /messages/i });
    expect(messagesLink).toHaveClass("text-primary");
  });

  it("highlights Settings tab when on settings route", () => {
    mockUsePathname.mockReturnValue("/settings");
    render(<BottomNavigation />);

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveClass("text-primary");
  });

  it("highlights Settings tab when on nested settings route", () => {
    mockUsePathname.mockReturnValue("/settings/business");
    render(<BottomNavigation />);

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveClass("text-primary");
  });

  it("has fixed positioning at bottom", () => {
    render(<BottomNavigation />);

    const nav = document.querySelector("nav");
    expect(nav).toHaveClass("fixed");
    expect(nav).toHaveClass("bottom-0");
  });

  it("has aria-label for accessibility", () => {
    render(<BottomNavigation />);

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("has 56px height (h-14)", () => {
    render(<BottomNavigation />);

    const navContainer = document.querySelector("nav > div");
    expect(navContainer).toHaveClass("h-14");
  });

  it("has minimum touch target size on links", () => {
    render(<BottomNavigation />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveClass("min-h-[44px]");
      expect(link).toHaveClass("min-w-[64px]");
    });
  });
});
