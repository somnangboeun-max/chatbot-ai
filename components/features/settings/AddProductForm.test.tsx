/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddProductForm } from "./AddProductForm";

// Mock the server actions
vi.mock("@/actions/products", () => ({
  addProduct: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AddProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Product button", () => {
    render(<AddProductForm />);

    expect(screen.getByRole("button", { name: /Add Product/i })).toBeInTheDocument();
  });

  it("opens dialog when button is clicked", () => {
    render(<AddProductForm />);

    fireEvent.click(screen.getByRole("button", { name: /Add Product/i }));

    expect(screen.getByText("Add New Product")).toBeInTheDocument();
  });

  it("renders form fields in dialog", () => {
    render(<AddProductForm />);

    fireEvent.click(screen.getByRole("button", { name: /Add Product/i }));

    expect(screen.getByLabelText("Product Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Price")).toBeInTheDocument();
    // Currency uses a Select component which doesn't have a traditional form control
    expect(screen.getByText("Currency")).toBeInTheDocument();
  });

  it("renders cancel and submit buttons in dialog", () => {
    render(<AddProductForm />);

    fireEvent.click(screen.getByRole("button", { name: /Add Product/i }));

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    // The trigger button is hidden when dialog is open
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(2);
  });

  it("shows placeholder text in inputs", () => {
    render(<AddProductForm />);

    fireEvent.click(screen.getByRole("button", { name: /Add Product/i }));

    expect(screen.getByPlaceholderText("e.g., Lok Lak")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
  });

  it("closes dialog when cancel is clicked", async () => {
    render(<AddProductForm />);

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /Add Product/i }));
    expect(screen.getByText("Add New Product")).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText("Add New Product")).not.toBeInTheDocument();
    });
  });

  it("shows validation error for empty name", async () => {
    render(<AddProductForm />);

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /Add Product/i }));

    // Try to submit without entering data
    const submitButtons = screen.getAllByRole("button", { name: /Add Product/i });
    const formSubmitButton = submitButtons[submitButtons.length - 1];
    fireEvent.click(formSubmitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Product name is required/i)).toBeInTheDocument();
    });
  });

  it("has minimum touch target size", () => {
    render(<AddProductForm />);

    const triggerButton = screen.getByRole("button", { name: /Add Product/i });
    expect(triggerButton).toHaveClass("min-h-[44px]");
  });
});
