// E2E Tests for MarketMate Extension - Marketplace Panel

import { test, expect } from "./fixtures";

test.describe("Marketplace Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page that mocks Facebook Marketplace
    await page.goto("/mock-marketplace");
  });

  test("should display collapsed panel on listing page", async ({ page }) => {
    const panel = page.locator('[data-testid="mm-panel-collapsed"]');
    await expect(panel).toBeVisible();

    // Check basic info is shown
    await expect(panel.locator(".mm-logo")).toContainText("MarketMate");
  });

  test("should expand panel when clicking expand button", async ({ page }) => {
    const expandBtn = page.locator('[data-testid="mm-expand-btn"]');
    await expandBtn.click();

    const expandedPanel = page.locator('[data-testid="mm-panel-expanded"]');
    await expect(expandedPanel).toBeVisible();
  });

  test("should display asking price from listing", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const askingPrice = page.locator('[data-testid="mm-asking-price"]');
    await expect(askingPrice).toContainText("$");
  });

  test("should display fair value range after analysis", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const fairRange = page.locator('[data-testid="mm-fair-range"]');
    await expect(fairRange).toBeVisible();
    await expect(fairRange).toContainText("$");
  });

  test("should display flexibility indicator", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const flexibility = page.locator('[data-testid="mm-flexibility"]');
    await expect(flexibility).toBeVisible();
  });

  test("should display recommended offer", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const recommended = page.locator('[data-testid="mm-recommended"]');
    await expect(recommended).toBeVisible();
    await expect(recommended).toContainText("$");
  });

  test("should allow adjusting max price via slider", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const slider = page.locator('[data-testid="mm-max-price-slider"]');
    await expect(slider).toBeVisible();

    // Adjust slider
    await slider.fill("200");
    await expect(slider).toHaveValue("200");
  });

  test("should allow selecting negotiation style", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const styleSelector = page.locator('[data-testid="mm-style-selector"]');
    await expect(styleSelector).toBeVisible();

    // Select neutral style
    await styleSelector.locator('input[value="neutral"]').click();
    await expect(styleSelector.locator('input[value="neutral"]')).toBeChecked();
  });

  test("should show pricing factors when expanded", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const factors = page.locator('[data-testid="mm-factors"]');
    await factors.click(); // Expand details

    const factorsList = page.locator(".mm-factors-list");
    await expect(factorsList).toBeVisible();
  });

  test("should collapse panel when clicking collapse button", async ({
    page,
  }) => {
    // First expand
    await page.locator('[data-testid="mm-expand-btn"]').click();
    await expect(
      page.locator('[data-testid="mm-panel-expanded"]')
    ).toBeVisible();

    // Then collapse
    await page.locator('[data-testid="mm-collapse-btn"]').click();
    await expect(
      page.locator('[data-testid="mm-panel-collapsed"]')
    ).toBeVisible();
  });

  test("should trigger suggest message action", async ({ page }) => {
    await page.locator('[data-testid="mm-expand-btn"]').click();

    const suggestBtn = page.locator('[data-testid="mm-suggest-btn"]');
    await expect(suggestBtn).toBeVisible();
    await suggestBtn.click();

    // Message should be copied to clipboard (or shown in UI)
  });
});
