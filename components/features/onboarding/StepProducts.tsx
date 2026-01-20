"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProductCard } from "./ProductCard";
import { NavigationButtons } from "./NavigationButtons";
import { useOnboarding } from "./OnboardingContext";
import { saveProducts } from "@/actions/onboarding";
import { productSchema, type ProductInput } from "@/lib/validations/onboarding";

interface Product extends ProductInput {
  tempId?: string;
}

/**
 * StepProducts Component
 *
 * Step 5 of onboarding: Add products with prices.
 * Allows adding, editing, and removing products with USD/KHR support.
 */
export function StepProducts() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<Product[]>(data.products ?? []);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: undefined,
      currency: "USD",
    },
  });

  const addProduct = (values: ProductInput) => {
    const newProduct: Product = {
      ...values,
      tempId: crypto.randomUUID(),
    };
    setProducts((prev) => [...prev, newProduct]);
    form.reset({
      name: "",
      price: undefined,
      currency: "USD",
    });
    toast.success("Product added");
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
    toast.success("Product removed");
  };

  const updateProduct = (index: number, updated: ProductInput) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updated } : p))
    );
    toast.success("Product updated");
  };

  const handleContinue = () => {
    if (products.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveProducts({ products });

        if (!result.success) {
          toast.error(result.error.message);
          return;
        }

        updateData("products", products);
        router.push("/onboarding/review");
      } catch (error) {
        console.error("[ERROR] [ONBOARDING] Step 5 submit failed:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleBack = () => {
    updateData("products", products);
    router.push("/onboarding/4");
  };

  return (
    <div className="space-y-6">
      {/* Products List */}
      <div className="space-y-3">
        {products.map((product, index) => (
          <ProductCard
            key={product.tempId ?? product.id ?? index}
            product={product}
            onUpdate={(updated) => updateProduct(index, updated)}
            onDelete={() => removeProduct(index)}
            isLoading={isPending}
          />
        ))}

        {products.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No products added yet.</p>
            <p className="text-sm">Add your first product below.</p>
          </div>
        )}
      </div>

      {/* Add Product Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(addProduct)}
          className="space-y-4 p-4 border rounded-lg bg-muted/50"
        >
          <h3 className="font-medium">Add New Product</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Lok Lak, បាយឆា"
                    className="min-h-[44px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="5.00"
                      className="min-h-[44px]"
                      {...field}
                      value={field.value ?? ""}
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
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select currency" />
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

          <Button
            type="submit"
            variant="secondary"
            className="w-full min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </form>
      </Form>

      {/* Navigation */}
      <NavigationButtons
        currentStep={5}
        isSubmitting={isPending}
        isValid={products.length > 0}
        onSubmit={handleContinue}
        onBack={handleBack}
        submitLabel={
          products.length === 0 ? "Add at least 1 product" : "Continue to Review"
        }
      />
    </div>
  );
}
