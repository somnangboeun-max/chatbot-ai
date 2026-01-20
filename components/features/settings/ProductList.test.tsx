/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductList } from "./ProductList";

// Mock ProductEditCard to simplify testing
vi.mock("./ProductEditCard", () => ({
  ProductEditCard: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-edit-card">{product.name}</div>
  ),
}));

describe("ProductList", () => {
  const mockProducts = [
    {
      id: "product-1",
      tenant_id: "tenant-1",
      name: "Lok Lak",
      price: 5.0,
      currency: "USD" as const,
      is_active: true,
      created_at: "2026-01-20T00:00:00Z",
      updated_at: "2026-01-20T00:00:00Z",
    },
    {
      id: "product-2",
      tenant_id: "tenant-1",
      name: "Amok",
      price: 6.5,
      currency: "USD" as const,
      is_active: true,
      created_at: "2026-01-20T00:00:00Z",
      updated_at: "2026-01-20T00:00:00Z",
    },
    {
      id: "product-3",
      tenant_id: "tenant-1",
      name: "Pho",
      price: 15000,
      currency: "KHR" as const,
      is_active: true,
      created_at: "2026-01-20T00:00:00Z",
      updated_at: "2026-01-20T00:00:00Z",
    },
  ];

  it("renders empty state when no products", () => {
    render(<ProductList products={[]} />);

    expect(screen.getByText("No products yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first product using the button above.")
    ).toBeInTheDocument();
  });

  it("renders product cards for each product", () => {
    render(<ProductList products={mockProducts} />);

    expect(screen.getAllByTestId("product-edit-card")).toHaveLength(3);
    expect(screen.getByText("Lok Lak")).toBeInTheDocument();
    expect(screen.getByText("Amok")).toBeInTheDocument();
    expect(screen.getByText("Pho")).toBeInTheDocument();
  });

  it("renders single product correctly", () => {
    render(<ProductList products={[mockProducts[0]]} />);

    expect(screen.getAllByTestId("product-edit-card")).toHaveLength(1);
    expect(screen.getByText("Lok Lak")).toBeInTheDocument();
  });

  it("does not show empty state when products exist", () => {
    render(<ProductList products={mockProducts} />);

    expect(screen.queryByText("No products yet")).not.toBeInTheDocument();
  });
});
