/**
 * E2E Tests for Products Onboarding Step
 * Story: 2.2 Products and Prices Onboarding Step
 *
 * These tests verify the complete user journey for adding products
 * during the onboarding process.
 *
 * Prerequisites:
 * - Local Supabase running with test user
 * - Test user completed steps 1-4 of onboarding
 *
 * Run: npx playwright test products-onboarding.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";

// Test user credentials (use test environment)
const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
};

/**
 * Helper: Login and navigate to products step
 */
async function loginAndNavigateToProducts(page: Page) {
  // Note: In a real test environment, you would seed the database
  // with a test user who has completed steps 1-4
  await page.goto("/auth/login");
  await page.fill('[name="email"]', TEST_USER.email);
  await page.fill('[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to onboarding or dashboard
  await page.waitForURL(/\/(onboarding|dashboard)/);

  // Navigate to products step if not already there
  if (!page.url().includes("/onboarding/5")) {
    await page.goto("/onboarding/5");
  }

  await page.waitForSelector('[data-testid="step-products"]', { timeout: 10000 }).catch(() => {
    // Fallback: wait for the Add Product form
    return page.waitForSelector('text=Add New Product');
  });
}

test.describe("Products Onboarding Step", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    // Skip login for isolated tests - use direct navigation with test session
    // In production, you would use a test helper to set up authentication
  });

  test("displays empty state when no products exist", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Should show empty state message
    await expect(page.locator("text=No products added yet")).toBeVisible();
    await expect(page.locator("text=Add your first product below")).toBeVisible();

    // Continue button should be disabled
    const continueButton = page.locator('button:has-text("Add at least 1 product")');
    await expect(continueButton).toBeDisabled();
  });

  test("adds a product with USD currency", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Fill in product form
    await page.fill('input[name="name"]', "Lok Lak");
    await page.fill('input[name="price"]', "5.00");

    // Currency defaults to USD, but let's verify
    await expect(page.locator('button:has-text("USD")')).toBeVisible();

    // Click add product
    await page.click('button:has-text("Add Product")');

    // Product should appear in list
    await expect(page.locator("text=Lok Lak")).toBeVisible();
    await expect(page.locator("text=$5.00")).toBeVisible();

    // Continue button should now be enabled
    await expect(page.locator('button:has-text("Continue to Review")')).toBeEnabled();
  });

  test("adds a product with KHR currency", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Fill in product form
    await page.fill('input[name="name"]', "Coffee");
    await page.fill('input[name="price"]', "5000");

    // Select KHR currency
    await page.click('button[role="combobox"]');
    await page.click('text=KHR');

    // Click add product
    await page.click('button:has-text("Add Product")');

    // Product should appear with KHR formatting
    await expect(page.locator("text=Coffee")).toBeVisible();
    await expect(page.locator("text=5,000៛")).toBeVisible();
  });

  test("adds product with Khmer name", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Fill in product form with Khmer name
    await page.fill('input[name="name"]', "បាយឆា");
    await page.fill('input[name="price"]', "4.00");

    // Click add product
    await page.click('button:has-text("Add Product")');

    // Product should appear with Khmer name
    await expect(page.locator("text=បាយឆា")).toBeVisible();
    await expect(page.locator("text=$4.00")).toBeVisible();
  });

  test("validates required product name", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Only fill price, leave name empty
    await page.fill('input[name="price"]', "5.00");

    // Click add product
    await page.click('button:has-text("Add Product")');

    // Should show validation error
    await expect(page.locator("text=Product name is required")).toBeVisible();
  });

  test("validates positive price", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Fill in form with zero price
    await page.fill('input[name="name"]', "Free Item");
    await page.fill('input[name="price"]', "0");

    // Click add product
    await page.click('button:has-text("Add Product")');

    // Should show validation error
    await expect(page.locator("text=Price must be greater than 0")).toBeVisible();
  });

  test("edits existing product", async ({ page }) => {
    await page.goto("/onboarding/5");

    // First add a product
    await page.fill('input[name="name"]', "Original Name");
    await page.fill('input[name="price"]', "10.00");
    await page.click('button:has-text("Add Product")');

    // Wait for product to appear
    await expect(page.locator("text=Original Name")).toBeVisible();

    // Click edit button
    await page.click('button[aria-label="Edit product"]');

    // Should show edit form
    await expect(page.locator('input[value="Original Name"]')).toBeVisible();

    // Update the name
    await page.fill('input[value="Original Name"]', "Updated Name");

    // Save changes
    await page.click('button:has-text("Save")');

    // Should show updated name
    await expect(page.locator("text=Updated Name")).toBeVisible();
    await expect(page.locator("text=Original Name")).not.toBeVisible();
  });

  test("deletes product from list", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Add a product
    await page.fill('input[name="name"]', "Product to Delete");
    await page.fill('input[name="price"]', "15.00");
    await page.click('button:has-text("Add Product")');

    // Wait for product to appear
    await expect(page.locator("text=Product to Delete")).toBeVisible();

    // Click delete button
    await page.click('button[aria-label="Delete product"]');

    // Product should be removed
    await expect(page.locator("text=Product to Delete")).not.toBeVisible();

    // Should show empty state again
    await expect(page.locator("text=No products added yet")).toBeVisible();
  });

  test("cancels product edit", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Add a product
    await page.fill('input[name="name"]', "Keep This Name");
    await page.fill('input[name="price"]', "20.00");
    await page.click('button:has-text("Add Product")');

    // Click edit button
    await page.click('button[aria-label="Edit product"]');

    // Modify the name
    await page.fill('input[value="Keep This Name"]', "Changed Name");

    // Cancel
    await page.click('button:has-text("Cancel")');

    // Should still show original name
    await expect(page.locator("text=Keep This Name")).toBeVisible();
    await expect(page.locator("text=Changed Name")).not.toBeVisible();
  });

  test("adds multiple products with mixed currencies", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Add first product (USD)
    await page.fill('input[name="name"]', "Fried Rice");
    await page.fill('input[name="price"]', "4.50");
    await page.click('button:has-text("Add Product")');

    // Add second product (KHR)
    await page.fill('input[name="name"]', "Tea");
    await page.fill('input[name="price"]', "2000");
    await page.click('button[role="combobox"]');
    await page.click('text=KHR');
    await page.click('button:has-text("Add Product")');

    // Add third product with Khmer name (USD)
    await page.fill('input[name="name"]', "លក់ឡាក់");
    await page.fill('input[name="price"]', "6.00");
    await page.click('button[role="combobox"]');
    await page.click('text=USD');
    await page.click('button:has-text("Add Product")');

    // Verify all products are displayed
    await expect(page.locator("text=Fried Rice")).toBeVisible();
    await expect(page.locator("text=$4.50")).toBeVisible();
    await expect(page.locator("text=Tea")).toBeVisible();
    await expect(page.locator("text=2,000៛")).toBeVisible();
    await expect(page.locator("text=លក់ឡាក់")).toBeVisible();
    await expect(page.locator("text=$6.00")).toBeVisible();
  });

  test("removes middle product from list", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Add three products
    const products = ["First", "Middle", "Last"];
    for (const name of products) {
      await page.fill('input[name="name"]', name);
      await page.fill('input[name="price"]', "5.00");
      await page.click('button:has-text("Add Product")');
      await expect(page.locator(`text=${name}`)).toBeVisible();
    }

    // Delete the middle product (second delete button)
    const deleteButtons = page.locator('button[aria-label="Delete product"]');
    await deleteButtons.nth(1).click();

    // Verify middle product is removed, others remain
    await expect(page.locator("text=First")).toBeVisible();
    await expect(page.locator("text=Middle")).not.toBeVisible();
    await expect(page.locator("text=Last")).toBeVisible();
  });

  test("navigates back and preserves products", async ({ page }) => {
    await page.goto("/onboarding/5");

    // Add a product
    await page.fill('input[name="name"]', "Preserved Product");
    await page.fill('input[name="price"]', "10.00");
    await page.click('button:has-text("Add Product")');

    // Wait for product to appear
    await expect(page.locator("text=Preserved Product")).toBeVisible();

    // Click back
    await page.click('button:has-text("Back")');

    // Wait for navigation to step 4
    await page.waitForURL(/\/onboarding\/4/);

    // Navigate forward again
    await page.goto("/onboarding/5");

    // Product should still be there (loaded from context)
    // Note: This depends on implementation - may need to load from DB
    await expect(page.locator("text=Preserved Product")).toBeVisible();
  });

  test("touch targets are accessible on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/onboarding/5");

    // Add a product first
    await page.fill('input[name="name"]', "Mobile Test");
    await page.fill('input[name="price"]', "5.00");
    await page.click('button:has-text("Add Product")');

    // Check edit and delete buttons have adequate touch targets
    const editButton = page.locator('button[aria-label="Edit product"]');
    const deleteButton = page.locator('button[aria-label="Delete product"]');

    // Get bounding boxes
    const editBox = await editButton.boundingBox();
    const deleteBox = await deleteButton.boundingBox();

    // Verify minimum 44px touch targets
    expect(editBox?.width).toBeGreaterThanOrEqual(44);
    expect(editBox?.height).toBeGreaterThanOrEqual(44);
    expect(deleteBox?.width).toBeGreaterThanOrEqual(44);
    expect(deleteBox?.height).toBeGreaterThanOrEqual(44);
  });
});
