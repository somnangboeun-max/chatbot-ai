/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductEditCard } from "./ProductEditCard";

// Mock the server actions
vi.mock("@/actions/products", () => ({
  updateProduct: vi.fn().mockResolvedValue({ success: true, data: {} }),
  deleteProduct: vi.fn().mockResolvedValue({ success: true, data: { deleted: true } }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock formatPrice utility
vi.mock("@/lib/utils/formatCurrency", () => ({
  formatPrice: vi.fn((price, currency) =>
    currency === "USD" ? `$${price.toFixed(2)}` : `${price.toLocaleString()}៛`
  ),
}));

describe("ProductEditCard", () => {
  const mockProduct = {
    id: "product-1",
    tenant_id: "tenant-1",
    name: "Lok Lak",
    price: 5.0,
    currency: "USD" as const,
    is_active: true,
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product name", () => {
    render(<ProductEditCard product={mockProduct} />);

    expect(screen.getByText("Lok Lak")).toBeInTheDocument();
  });

  it("renders product price with currency", () => {
    render(<ProductEditCard product={mockProduct} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("renders delete button with accessible label", () => {
    render(<ProductEditCard product={mockProduct} />);

    const deleteButton = screen.getByRole("button", { name: /Delete Lok Lak/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it("opens delete dialog when delete button is clicked", () => {
    render(<ProductEditCard product={mockProduct} />);

    const deleteButton = screen.getByRole("button", { name: /Delete Lok Lak/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText("Remove this product?")).toBeInTheDocument();
  });

  it("shows product name in delete confirmation", () => {
    render(<ProductEditCard product={mockProduct} />);

    const deleteButton = screen.getByRole("button", { name: /Delete Lok Lak/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText(/Are you sure you want to remove "Lok Lak"\?/)).toBeInTheDocument();
  });

  it("renders edit buttons for name and price", () => {
    render(<ProductEditCard product={mockProduct} />);

    // InlineEditField renders buttons with edit labels
    expect(screen.getByLabelText("Edit Product name")).toBeInTheDocument();
    expect(screen.getByLabelText("Edit Price")).toBeInTheDocument();
  });

  it("renders formatted price display", () => {
    render(<ProductEditCard product={mockProduct} />);

    // The formatted price is displayed
    expect(screen.getByText("($5.00)")).toBeInTheDocument();
  });

  it("handles KHR currency", () => {
    const khrProduct = {
      ...mockProduct,
      price: 20000,
      currency: "KHR" as const,
    };

    render(<ProductEditCard product={khrProduct} />);

    expect(screen.getByText("KHR")).toBeInTheDocument();
    expect(screen.getByText("(20,000៛)")).toBeInTheDocument();
  });
});
