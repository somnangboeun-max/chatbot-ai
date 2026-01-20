"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  productSchema,
  formatPrice,
  type ProductInput,
  type Currency,
} from "@/lib/validations/onboarding";

interface ProductCardProps {
  product: ProductInput;
  onUpdate: (updated: ProductInput) => void;
  onDelete: () => void;
  isLoading?: boolean;
}

/**
 * ProductCard Component
 *
 * Displays a single product with inline editing capability.
 * Used in the products list during onboarding step 5.
 */
export function ProductCard({
  product,
  onUpdate,
  onDelete,
  isLoading = false,
}: ProductCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
    },
  });

  const handleSave = (values: ProductInput) => {
    onUpdate(values);
    setIsEditing(false);
  };

  const handleCancel = () => {
    form.reset({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Product name"
                      className="min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Price"
                        className="min-h-[44px]"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="KHR">KHR (៛)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border rounded-lg p-4 bg-card">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(product.price, product.currency as Currency)}
        </p>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Edit product"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
          aria-label="Delete product"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
