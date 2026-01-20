/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineEditField } from "./InlineEditField";

describe("InlineEditField", () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    mockOnSave.mockReset();
    mockOnSave.mockResolvedValue(undefined);
  });

  it("renders with value in display mode", () => {
    render(
      <InlineEditField
        value="Test Value"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    expect(screen.getByText("Test Value")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit test field/i })).toBeInTheDocument();
  });

  it("renders placeholder when value is empty", () => {
    render(
      <InlineEditField
        value=""
        onSave={mockOnSave}
        label="Test Field"
        placeholder="Enter value"
      />
    );

    expect(screen.getByText("Enter value")).toBeInTheDocument();
  });

  it("enters edit mode on click", async () => {
    const user = userEvent.setup();

    render(
      <InlineEditField
        value="Test Value"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit test field/i }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Test Value");
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("saves on blur", async () => {
    const user = userEvent.setup();

    render(
      <InlineEditField
        value="Original"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit test field/i }));

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New Value");

    // Blur the input
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith("New Value");
    });
  });

  it("saves on Enter key", async () => {
    const user = userEvent.setup();

    render(
      <InlineEditField
        value="Original"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit test field/i }));

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New Value{Enter}");

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith("New Value");
    });
  });

  it("cancels on Escape key", async () => {
    const user = userEvent.setup();

    render(
      <InlineEditField
        value="Original"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit test field/i }));

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New Value");
    await user.keyboard("{Escape}");

    // Should exit edit mode without saving
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("does not save if value unchanged", async () => {
    const user = userEvent.setup();

    render(
      <InlineEditField
        value="Original"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit test field/i }));

    const input = screen.getByRole("textbox");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  it("shows inline error on save failure", async () => {
    const user = userEvent.setup();
    mockOnSave.mockRejectedValue(new Error("Save failed"));

    render(
      <InlineEditField
        value="Original"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit test field/i }));

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New Value");
    fireEvent.blur(input);

    // After error, should show inline error message and stay in edit mode
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Save failed");
      expect(screen.getByRole("textbox")).toHaveValue("New Value");
    });
  });

  it("has minimum 44px touch target", () => {
    render(
      <InlineEditField
        value="Test Value"
        onSave={mockOnSave}
        label="Test Field"
      />
    );

    const button = screen.getByRole("button", { name: /edit test field/i });
    expect(button).toHaveClass("min-h-[44px]");
  });
});
