/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardHeader } from "./DashboardHeader";

describe("DashboardHeader", () => {
  it("renders business name", () => {
    render(<DashboardHeader businessName="Test Business" botActive={true} />);

    expect(screen.getByText("Test Business")).toBeInTheDocument();
  });

  it("renders bot status indicator in active state", () => {
    render(<DashboardHeader businessName="Test Business" botActive={true} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders bot status indicator in paused state", () => {
    render(<DashboardHeader businessName="Test Business" botActive={false} />);

    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("renders as a header element", () => {
    render(<DashboardHeader businessName="Test Business" botActive={true} />);

    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("has sticky positioning", () => {
    render(<DashboardHeader businessName="Test Business" botActive={true} />);

    const header = document.querySelector("header");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
  });

  it("truncates long business names", () => {
    render(
      <DashboardHeader
        businessName="Very Long Business Name That Should Be Truncated"
        botActive={true}
      />
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("truncate");
    expect(heading).toHaveClass("max-w-[200px]");
  });
});
