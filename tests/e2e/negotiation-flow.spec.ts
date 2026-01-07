// E2E Tests for Negotiation Flow

import { test, expect } from "./fixtures";

test.describe("Full Negotiation Flow", () => {
  test("should complete full negotiation from listing to accepted", async ({
    page,
    context,
  }) => {
    // Step 1: Navigate to marketplace listing
    await page.goto("/mock-marketplace");

    // Step 2: Expand panel and view analysis
    await page.locator('[data-testid="mm-expand-btn"]').click();
    await expect(page.locator('[data-testid="mm-fair-range"]')).toBeVisible();

    // Step 3: Adjust max price
    const slider = page.locator('[data-testid="mm-max-price-slider"]');
    await slider.fill("200");

    // Step 4: Select negotiation style
    await page.locator('input[value="polite"]').click();

    // Step 5: Get suggested message
    await page.locator('[data-testid="mm-suggest-btn"]').click();

    // Step 6: Navigate to messenger (simulated)
    const messengerPage = await context.newPage();
    await messengerPage.goto("/mock-messenger");

    // Step 7: Verify overlay appears with suggestion
    const overlay = messengerPage.locator('[data-testid="mm-overlay"]');
    await expect(overlay).toBeVisible();

    // Step 8: Send initial offer
    await messengerPage.locator('[data-testid="mm-send-suggestion"]').click();

    // Step 9: Simulate seller counter
    await messengerPage.evaluate(() => {
      localStorage.setItem(
        "marketmate-negotiation",
        JSON.stringify({
          id: "test-neg-1",
          listingId: "test-listing-1",
          state: "COUNTER_RECEIVED",
          initialOffer: 180,
          currentOffer: 180,
          maxPrice: 200,
          counterHistory: [
            {
              amount: 195,
              fromSeller: true,
              timestamp: new Date().toISOString(),
            },
          ],
          messages: [],
        })
      );
      window.dispatchEvent(new Event("storage"));
    });

    // Step 10: Accept (counter is within max)
    await messengerPage.reload();
    const sendBtn = messengerPage.locator('[data-testid="mm-send-suggestion"]');
    await expect(sendBtn).toContainText("Accept");
    await sendBtn.click();

    // Verify negotiation completed
    const storedNeg = await messengerPage.evaluate(() => {
      return localStorage.getItem("marketmate-negotiation");
    });
    expect(JSON.parse(storedNeg!).state).toBe("ACCEPTED");
  });

  test("should walk away when seller counter exceeds max", async ({
    page,
    context,
  }) => {
    // Set up initial negotiation
    await page.goto("/mock-marketplace");
    await page.locator('[data-testid="mm-expand-btn"]').click();

    // Set low max price
    await page.locator('[data-testid="mm-max-price-slider"]').fill("180");
    await page.locator('[data-testid="mm-suggest-btn"]').click();

    // Go to messenger
    const messengerPage = await context.newPage();
    await messengerPage.goto("/mock-messenger");

    // Simulate high counter offer
    await messengerPage.evaluate(() => {
      localStorage.setItem(
        "marketmate-negotiation",
        JSON.stringify({
          id: "test-neg-1",
          listingId: "test-listing-1",
          state: "COUNTER_RECEIVED",
          initialOffer: 160,
          currentOffer: 180,
          maxPrice: 180,
          counterHistory: [
            {
              amount: 200,
              fromSeller: true,
              timestamp: new Date().toISOString(),
            },
            {
              amount: 175,
              fromSeller: false,
              timestamp: new Date().toISOString(),
            },
            {
              amount: 195,
              fromSeller: true,
              timestamp: new Date().toISOString(),
            },
          ],
          messages: [],
        })
      );
    });

    await messengerPage.reload();

    // Should show walk away option
    const sendBtn = messengerPage.locator('[data-testid="mm-send-suggestion"]');
    await expect(sendBtn).toContainText("End Negotiation");
  });

  test("should maintain state across page navigations", async ({ page }) => {
    // Start negotiation
    await page.goto("/mock-marketplace");
    await page.locator('[data-testid="mm-expand-btn"]').click();
    await page.locator('[data-testid="mm-max-price-slider"]').fill("210");
    await page.locator('input[value="neutral"]').click();
    await page.locator('[data-testid="mm-suggest-btn"]').click();

    // Navigate away and back
    await page.goto("/mock-marketplace?item=different");
    await page.goto("/mock-marketplace");

    // Preferences should be preserved
    await page.locator('[data-testid="mm-expand-btn"]').click();
    const slider = page.locator('[data-testid="mm-max-price-slider"]');
    await expect(slider).toHaveValue("210");
  });
});
