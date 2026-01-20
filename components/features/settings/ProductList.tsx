"use client";

import { ProductEditCard } from "./ProductEditCard";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { Product } from "@/types";

interface ProductListProps {
  products: Product[];
}

/**
 * ProductList Component
 *
 * Displays a list of products with edit/delete capabilities.
 * Shows empty state when no products exist.
 */
export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No products yet</h3>
          <p className="text-sm text-muted-foreground">
            Add your first product using the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductEditCard key={product.id} product={product} />
      ))}
    </div>
  );
}
