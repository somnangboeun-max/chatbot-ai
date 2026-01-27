/** @vitest-environment happy-dom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewMessageIndicator } from "./NewMessageIndicator";

describe("NewMessageIndicator", () => {
  it("renders singular 'New message' when count is 1", () => {
    render(<NewMessageIndicator count={1} onClick={vi.fn()} />);

    expect(screen.getByText("New message")).toBeInTheDocument();
  });

  it("renders plural 'X new messages' when count is greater than 1", () => {
    render(<NewMessageIndicator count={5} onClick={vi.fn()} />);

    expect(screen.getByText("5 new messages")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<NewMessageIndicator count={3} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId("new-message-indicator"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has correct styling for visibility", () => {
    render(<NewMessageIndicator count={2} onClick={vi.fn()} />);

    const button = screen.getByTestId("new-message-indicator");
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("rounded-full");
  });

  it("is positioned at the bottom center", () => {
    render(<NewMessageIndicator count={1} onClick={vi.fn()} />);

    const button = screen.getByTestId("new-message-indicator");
    expect(button.className).toContain("absolute");
    expect(button.className).toContain("bottom-4");
  });
});
