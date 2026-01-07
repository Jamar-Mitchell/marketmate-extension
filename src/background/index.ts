// Background Service Worker for MarketMate

import type {
  ExtensionMessage,
  ExtensionResponse,
  UserPreferences,
  NegotiationSession,
} from "../types";

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  maxSpend: 0,
  style: "polite",
  automationLevel: "suggest-only",
  mockMode: false,
};

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("MarketMate installed");

  const stored = await chrome.storage.local.get(["preferences"]);
  if (!stored.preferences) {
    await chrome.storage.local.set({ preferences: DEFAULT_PREFERENCES });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }
);

async function handleMessage(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  switch (message.type) {
    case "GET_STATE": {
      const state = await chrome.storage.local.get([
        "preferences",
        "currentNegotiation",
      ]);
      return { success: true, data: state };
    }

    case "UPDATE_PREFERENCES": {
      const preferences = message.payload as Partial<UserPreferences>;
      const current = await chrome.storage.local.get(["preferences"]);
      const updated = { ...current.preferences, ...preferences };
      await chrome.storage.local.set({ preferences: updated });
      return { success: true, data: updated };
    }

    case "UPDATE_NEGOTIATION_STATE": {
      const negotiation = message.payload as NegotiationSession;
      await chrome.storage.local.set({ currentNegotiation: negotiation });
      return { success: true, data: negotiation };
    }

    case "ANALYZE_PRICE": {
      // Price analysis is handled in the pricing engine
      return { success: true };
    }

    case "GENERATE_MESSAGE": {
      // Message generation is handled in the negotiation engine
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

// Export for testing
export { handleMessage, DEFAULT_PREFERENCES };
