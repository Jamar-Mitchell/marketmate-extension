// E2E Tests for MarketMate Extension - Messenger Overlay

import { test, expect } from "./fixtures";

test.describe("Messenger Overlay", () => {
  test.beforeEach(async ({ page }) => {
    // Set up active negotiation in storage
    await page.goto("/mock-messenger");

    // Simulate having an active negotiation
    await page.evaluate(() => {
      localStorage.setItem(
        "marketmate-negotiation",
        JSON.stringify({
          id: "test-neg-1",
          listingId: "test-listing-1",
          state: "INIT",
          initialOffer: 180,
          currentOffer: 180,
          maxPrice: 200,
          counterHistory: [],
          messages: [],
        })
      );
    });
  });

  test("should display overlay above messenger input", async ({ page }) => {
    const overlay = page.locator('[data-testid="mm-overlay"]');
    await expect(overlay).toBeVisible();
  });

  test("should display suggestion text", async ({ page }) => {
    const suggestionText = page.locator('[data-testid="mm-suggestion-text"]');
    await expect(suggestionText).toBeVisible();
    await expect(suggestionText).not.toBeEmpty();
  });

  test("should display confidence indicator", async ({ page }) => {
    const confidence = page.locator('[data-testid="mm-confidence"]');
    await expect(confidence).toBeVisible();
    await expect(confidence).toContainText("Confidence");
  });

  test("should allow editing suggestion", async ({ page }) => {
    const editBtn = page.locator('[data-testid="mm-edit-btn"]');
    await editBtn.click();

    const textarea = page.locator('[data-testid="mm-edit-textarea"]');
    await expect(textarea).toBeVisible();

    // Edit the text
    await textarea.fill("Custom message here");

    const saveBtn = page.locator('[data-testid="mm-save-edit"]');
    await saveBtn.click();

    const suggestionText = page.locator('[data-testid="mm-suggestion-text"]');
    await expect(suggestionText).toContainText("Custom message here");
  });

  test("should dismiss overlay when close button clicked", async ({ page }) => {
    const closeBtn = page.locator('[data-testid="mm-overlay-close"]');
    await closeBtn.click();

    const overlay = page.locator('[data-testid="mm-overlay"]');
    await expect(overlay).not.toBeVisible();
  });

  test("should insert message when send button clicked", async ({ page }) => {
    const sendBtn = page.locator('[data-testid="mm-send-suggestion"]');
    await sendBtn.click();

    // Check that message was inserted into Messenger input
    const messengerInput = page.locator('[data-testid="messenger-input-box"]');
    await expect(messengerInput).not.toBeEmpty();
  });
});

test.describe("Messenger Overlay - Counter Offers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mock-messenger");

    // Simulate having received a counter offer
    await page.evaluate(() => {
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
              amount: 220,
              fromSeller: true,
              timestamp: new Date().toISOString(),
            },
          ],
          messages: [],
        })
      );
    });
  });

  test("should display seller counter amount", async ({ page }) => {
    const overlay = page.locator('[data-testid="mm-overlay"]');
    await expect(overlay).toContainText("$220");
  });

  test("should show acceptance chance for counter offer", async ({ page }) => {
    const acceptance = page.locator('[data-testid="mm-acceptance"]');
    await expect(acceptance).toBeVisible();
    await expect(acceptance).toContainText("Acceptance Chance");
  });
});

test.describe("Messenger Overlay - Walk Away", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mock-messenger");

    // Simulate negotiation where we need to walk away
    await page.evaluate(() => {
      localStorage.setItem(
        "marketmate-negotiation",
        JSON.stringify({
          id: "test-neg-1",
          listingId: "test-listing-1",
          state: "COUNTER_RECEIVED",
          initialOffer: 180,
          currentOffer: 200,
          maxPrice: 200,
          counterHistory: [
            {
              amount: 220,
              fromSeller: true,
              timestamp: new Date().toISOString(),
            },
            {
              amount: 195,
              fromSeller: false,
              timestamp: new Date().toISOString(),
            },
            {
              amount: 215,
              fromSeller: true,
              timestamp: new Date().toISOString(),
            },
          ],
          messages: [],
        })
      );
    });
  });

  test("should show walk away option when max price exceeded", async ({
    page,
  }) => {
    const sendBtn = page.locator('[data-testid="mm-send-suggestion"]');
    await expect(sendBtn).toContainText("End Negotiation");
  });
});
