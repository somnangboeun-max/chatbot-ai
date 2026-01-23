/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BotStatusIndicator } from "./BotStatusIndicator";

describe("BotStatusIndicator", () => {
  it("renders active state correctly", () => {
    render(<BotStatusIndicator isActive={true} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
    const dot = document.querySelector("span[aria-hidden='true']");
    expect(dot).toHaveClass("bg-success");
  });

  it("renders paused state correctly", () => {
    render(<BotStatusIndicator isActive={false} />);

    expect(screen.getByText("Paused")).toBeInTheDocument();
    const dot = document.querySelector("span[aria-hidden='true']");
    expect(dot).toHaveClass("bg-error");
  });

  it("renders compact variant with sr-only label on mobile", () => {
    render(<BotStatusIndicator isActive={true} variant="compact" />);

    const label = screen.getByText("Active");
    expect(label).toHaveClass("sr-only");
    expect(label).toHaveClass("sm:not-sr-only");
  });

  it("renders full variant with visible label", () => {
    render(<BotStatusIndicator isActive={true} variant="full" />);

    const label = screen.getByText("Active");
    expect(label).not.toHaveClass("sr-only");
  });

  it("applies custom className", () => {
    const { container } = render(
      <BotStatusIndicator isActive={true} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("applies correct text color for active state", () => {
    render(<BotStatusIndicator isActive={true} />);

    const label = screen.getByText("Active");
    expect(label).toHaveClass("text-success");
  });

  it("applies correct text color for paused state", () => {
    render(<BotStatusIndicator isActive={false} />);

    const label = screen.getByText("Paused");
    expect(label).toHaveClass("text-error");
  });
});
