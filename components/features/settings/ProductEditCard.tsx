"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { InlineEditField } from "./InlineEditField";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { updateProduct, deleteProduct } from "@/actions/products";
import { formatPrice } from "@/lib/utils/formatCurrency";
import type { Product } from "@/types";

interface ProductEditCardProps {
  product: Product;
}

/**
 * ProductEditCard Component
 *
 * Displays a single product with inline editing capability.
 * Supports editing name and price, with soft delete.
 */
export function ProductEditCard({ product }: ProductEditCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSaveName = async (value: string) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const result = await updateProduct(product.id, {
          name: value,
          price: product.price,
          currency: product.currency,
        });

        if (result.success) {
          toast.success("Product updated");
          resolve();
        } else {
          toast.error(result.error.message);
          reject(new Error(result.error.message));
        }
      });
    });
  };

  const handleSavePrice = async (value: string) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
          toast.error("Price must be a positive number");
          reject(new Error("Price must be a positive number"));
          return;
        }

        const result = await updateProduct(product.id, {
          name: product.name,
          price: price,
          currency: product.currency,
        });

        if (result.success) {
          toast.success("Price updated");
          resolve();
        } else {
          toast.error(result.error.message);
          reject(new Error(result.error.message));
        }
      });
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(product.id);

      if (result.success) {
        toast.success("Product removed");
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  return (
    <>
      <Card className="relative">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <InlineEditField
                value={product.name}
                onSave={handleSaveName}
                label="Product name"
                placeholder="Enter product name"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {product.currency}
                </span>
                <InlineEditField
                  value={String(product.price)}
                  onSave={handleSavePrice}
                  label="Price"
                  placeholder="0.00"
                  className="max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground ml-2">
                  ({formatPrice(product.price, product.currency)})
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="h-11 w-11 text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteProductDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        productName={product.name}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}
