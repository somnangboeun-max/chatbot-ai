/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSummaryCard, HeroSummaryCardSkeleton } from "./HeroSummaryCard";
import { StatDisplay } from "./StatDisplay";
import type { DashboardStats } from "@/types/dashboard";

const baseStats: DashboardStats = {
  messagesHandledToday: 15,
  messagesHandledThisWeek: 42,
  overnightMessages: 0,
  ordersCaptured: 3,
  attentionNeeded: 2,
  hasOvernightMessages: false,
};

describe("HeroSummaryCard", () => {
  it("renders primary stat (messages handled today) prominently", () => {
    render(<HeroSummaryCard stats={baseStats} />);

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("messages handled today")).toBeInTheDocument();
  });

  it("renders 'While you slept...' when overnight messages > 0", () => {
    const overnightStats: DashboardStats = {
      ...baseStats,
      overnightMessages: 8,
      hasOvernightMessages: true,
    };

    render(<HeroSummaryCard stats={overnightStats} />);

    expect(screen.getByText("While you slept...")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(
      screen.getByText("messages handled overnight"),
    ).toBeInTheDocument();
  });

  it("renders empty state when no messages", () => {
    const emptyStats: DashboardStats = {
      messagesHandledToday: 0,
      messagesHandledThisWeek: 0,
      overnightMessages: 0,
      ordersCaptured: 0,
      attentionNeeded: 0,
      hasOvernightMessages: false,
    };

    render(<HeroSummaryCard stats={emptyStats} />);

    expect(
      screen.getByText("Ready to help your customers!"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect your Facebook Page to start receiving messages.",
      ),
    ).toBeInTheDocument();
  });

  it("renders secondary stats (orders, attention items)", () => {
    render(<HeroSummaryCard stats={baseStats} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("orders captured")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("need attention")).toBeInTheDocument();
  });

  it("does not show 'While you slept...' when hasOvernightMessages is false", () => {
    render(<HeroSummaryCard stats={baseStats} />);

    expect(screen.queryByText("While you slept...")).not.toBeInTheDocument();
  });

  it("shows overnight count as primary stat when overnight messages exist", () => {
    const overnightStats: DashboardStats = {
      ...baseStats,
      messagesHandledToday: 20,
      overnightMessages: 12,
      hasOvernightMessages: true,
    };

    render(<HeroSummaryCard stats={overnightStats} />);

    // Should show overnight count (12), not today count (20)
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.getByText("messages handled overnight"),
    ).toBeInTheDocument();
  });
});

describe("StatDisplay", () => {
  it("renders correct size for large variant", () => {
    const { container } = render(
      <StatDisplay value={42} label="test label" variant="large" />,
    );

    const valueElement = container.querySelector("span.text-4xl");
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveTextContent("42");
  });

  it("renders correct size for medium variant", () => {
    const { container } = render(
      <StatDisplay value={7} label="medium label" variant="medium" />,
    );

    const valueElement = container.querySelector("span.text-2xl");
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveTextContent("7");
  });

  it("renders correct size for small variant", () => {
    const { container } = render(
      <StatDisplay value={3} label="small label" variant="small" />,
    );

    const valueElement = container.querySelector("span.text-lg");
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveTextContent("3");
  });

  it("defaults to medium variant", () => {
    const { container } = render(
      <StatDisplay value={5} label="default label" />,
    );

    const valueElement = container.querySelector("span.text-2xl");
    expect(valueElement).toBeInTheDocument();
  });

  it("renders label text", () => {
    render(<StatDisplay value={10} label="my label" />);

    expect(screen.getByText("my label")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatDisplay value={1} label="test" className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("HeroSummaryCardSkeleton", () => {
  it("renders without errors", () => {
    const { container } = render(<HeroSummaryCardSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders skeleton placeholders for stats", () => {
    const { container } = render(<HeroSummaryCardSkeleton />);

    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll("[class*='animate-pulse'], [data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
