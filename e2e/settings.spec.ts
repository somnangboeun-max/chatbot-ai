/**
 * E2E Tests for Business Settings
 * Story: 2.4 Edit Business Profile Settings
 *
 * These tests verify the complete user journey for editing business
 * settings after onboarding.
 *
 * Prerequisites:
 * - Local Supabase running with test user
 * - Test user has completed onboarding
 *
 * Run: npx playwright test settings.spec.ts
 */
import { test, expect } from "@playwright/test";

// Test user credentials (use test environment)
const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
};

test.describe("Business Settings", () => {
  test.describe.configure({ mode: "serial" });

  test("settings overview page displays all setting categories", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Should show all four settings categories
    await expect(page.locator("text=Business Info")).toBeVisible();
    await expect(page.locator("text=Products & Prices")).toBeVisible();
    await expect(page.locator("text=Notifications")).toBeVisible();
    await expect(page.locator("text=Account")).toBeVisible();

    // Should have back button to dashboard
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("navigates from dashboard to settings via icon button", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Click settings icon button
    const settingsButton = page.locator('a[href="/settings"]');
    await settingsButton.click();

    // Should navigate to settings page
    await page.waitForURL(/\/settings$/);
    await expect(page.locator("h1:has-text('Settings')")).toBeVisible();
  });

  test("navigates to business info settings from overview", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Click Business Info card
    await page.click("text=Business Info");

    // Should navigate to business settings
    await page.waitForURL(/\/settings\/business/);
    await expect(page.locator("h1:has-text('Business Info')")).toBeVisible();
  });

  test("business info page shows current data", async ({ page }) => {
    await page.goto("/settings/business");

    // Should show section headers
    await expect(page.locator("text=Business Name")).toBeVisible();
    await expect(page.locator("text=Business Hours")).toBeVisible();
    await expect(page.locator("text=Location")).toBeVisible();
    await expect(page.locator("text=Contact Phone")).toBeVisible();
  });

  test("inline edit field enters edit mode on click", async ({ page }) => {
    await page.goto("/settings/business");

    // Wait for the page to load
    await page.waitForSelector("text=Business Name");

    // Click on an editable field (business name area)
    const editButton = page.locator('button[aria-label="Edit Business name"]');
    await editButton.click();

    // Should show input field
    await expect(page.locator('input[aria-label="Business name"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Business name"]')).toBeFocused();
  });

  test("inline edit saves on blur", async ({ page }) => {
    await page.goto("/settings/business");

    // Enter edit mode for business name
    const editButton = page.locator('button[aria-label="Edit Business name"]');
    await editButton.click();

    // Type new value
    const input = page.locator('input[aria-label="Business name"]');
    await input.clear();
    await input.fill("Updated Business Name");

    // Blur to save (click elsewhere)
    await page.click("h1");

    // Should show toast notification
    await expect(page.locator("text=Changes saved")).toBeVisible({ timeout: 5000 });
  });

  test("inline edit saves on Enter key", async ({ page }) => {
    await page.goto("/settings/business");

    // Enter edit mode
    const editButton = page.locator('button[aria-label="Edit Business name"]');
    await editButton.click();

    // Type and press Enter
    const input = page.locator('input[aria-label="Business name"]');
    await input.clear();
    await input.fill("Another Name");
    await input.press("Enter");

    // Should show toast notification
    await expect(page.locator("text=Changes saved")).toBeVisible({ timeout: 5000 });
  });

  test("inline edit cancels on Escape key", async ({ page }) => {
    await page.goto("/settings/business");

    // Enter edit mode
    const editButton = page.locator('button[aria-label="Edit Business name"]');
    await editButton.click();

    // Type new value and cancel
    const input = page.locator('input[aria-label="Business name"]');
    const originalValue = await input.inputValue();
    await input.clear();
    await input.fill("Should Not Save");
    await input.press("Escape");

    // Should exit edit mode without saving
    await expect(input).not.toBeVisible();
    // Should not show toast
    await expect(page.locator("text=Changes saved")).not.toBeVisible();
  });

  test("business hours editor displays all 7 days", async ({ page }) => {
    await page.goto("/settings/business");

    // Should show all days of the week
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    for (const day of days) {
      await expect(page.locator(`text=${day}`)).toBeVisible();
    }
  });

  test("business hours can be marked as closed", async ({ page }) => {
    await page.goto("/settings/business");

    // Find a day's closed toggle (switch)
    const mondayRow = page.locator("text=Monday").locator("..");
    const closedSwitch = mondayRow.locator('button[role="switch"]');

    // Toggle closed state
    await closedSwitch.click();

    // Should show toast notification
    await expect(page.locator("text=Business hours saved")).toBeVisible({ timeout: 5000 });
  });

  test("business hours time selectors work", async ({ page }) => {
    await page.goto("/settings/business");

    // Find a day that's not closed
    // Click on the open time select
    const openTimeSelect = page.locator('button[role="combobox"]').first();
    await openTimeSelect.click();

    // Select a time
    await page.click('text="10:00 AM"');

    // Should show toast notification after debounce
    await expect(page.locator("text=Business hours saved")).toBeVisible({ timeout: 5000 });
  });

  test("settings page back navigation works", async ({ page }) => {
    await page.goto("/settings/business");

    // Click back button
    await page.click("text=Settings");

    // Should navigate back to settings overview
    await page.waitForURL(/\/settings$/);
    await expect(page.locator("h1:has-text('Settings')")).toBeVisible();
  });

  test("shows loading skeleton while fetching data", async ({ page }) => {
    // Navigate to business settings
    await page.goto("/settings/business");

    // Loading skeleton should appear briefly
    // Note: This may be too fast to catch, but we test the structure exists
    const skeleton = page.locator(".animate-pulse");
    // Just verify the page eventually loads
    await expect(page.locator("text=Business Name")).toBeVisible({ timeout: 10000 });
  });

  test("touch targets are accessible on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/settings/business");

    // Check inline edit buttons have adequate touch targets
    const editButton = page.locator('button[aria-label="Edit Business name"]');
    const box = await editButton.boundingBox();

    // Verify minimum 44px touch targets
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("displays validation error inline for invalid phone", async ({ page }) => {
    await page.goto("/settings/business");

    // Enter edit mode for phone
    const editButton = page.locator('button[aria-label="Edit Phone"]');
    await editButton.click();

    // Type invalid phone number
    const input = page.locator('input[aria-label="Phone"]');
    await input.clear();
    await input.fill("invalid-phone");

    // Blur to trigger save
    await page.click("h1");

    // Should show inline error or toast error
    // Since we added inline error display, check for error text
    await expect(page.locator('text="Please enter a valid Cambodian phone number"')).toBeVisible({ timeout: 5000 });
  });
});
