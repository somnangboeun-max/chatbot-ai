/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteProductDialog } from "./DeleteProductDialog";

describe("DeleteProductDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    productName: "Lok Lak",
    onConfirm: vi.fn(),
    isPending: false,
  };

  it("renders dialog with product name", () => {
    render(<DeleteProductDialog {...defaultProps} />);

    expect(screen.getByText("Remove this product?")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to remove "Lok Lak"\?/)
    ).toBeInTheDocument();
  });

  it("shows Cancel and Remove buttons", () => {
    render(<DeleteProductDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
  });

  it("calls onConfirm when Remove is clicked", () => {
    const onConfirm = vi.fn();

    render(<DeleteProductDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange when Cancel is clicked", () => {
    const onOpenChange = vi.fn();

    render(<DeleteProductDialog {...defaultProps} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onOpenChange).toHaveBeenCalled();
  });

  it("shows loading state when isPending is true", () => {
    render(<DeleteProductDialog {...defaultProps} isPending={true} />);

    expect(screen.getByText(/Removing.../i)).toBeInTheDocument();
  });

  it("disables buttons when isPending is true", () => {
    render(<DeleteProductDialog {...defaultProps} isPending={true} />);

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Removing.../i })).toBeDisabled();
  });

  it("does not render when open is false", () => {
    render(<DeleteProductDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Remove this product?")).not.toBeInTheDocument();
  });
});
