// Test fixtures for MarketMate E2E tests

import { test as base, chromium, type BrowserContext } from "@playwright/test";
import path from "path";

// Extend base test with extension context
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // Custom fixture that loads the extension
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, "../../dist");

    const context = await chromium.launchPersistentContext("", {
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        "--no-sandbox",
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // Get extension ID from service worker
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

export { expect } from "@playwright/test";
