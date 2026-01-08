// Content Script Entry Point for Facebook Marketplace

import React from "react";
import { createRoot, Root } from "react-dom/client";
import { MarketplacePanel } from "../components/MarketplacePanel";
import { useStore } from "../store";
import { extractListingData, getMockListingData } from "./domExtractor";
import { generateMessage } from "../engine/negotiationEngine";
import "../styles/panel.css";

const PANEL_CONTAINER_ID = "marketmate-panel-root";

let currentRoot: Root | null = null;
let lastUrl = "";
let navigationInterval: ReturnType<typeof setInterval> | null = null;

// Check if we're on an item listing page
function isListingPage(): boolean {
  return window.location.pathname.includes("/marketplace/item/");
}

// Show a toast notification
function showToast(message: string, type: "success" | "error" = "success") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === "success" ? "#4CAF50" : "#f44336"};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Create container for React app
function createPanelContainer(): HTMLElement {
  let container = document.getElementById(PANEL_CONTAINER_ID);

  if (!container) {
    container = document.createElement("div");
    container.id = PANEL_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

// Remove the panel
function removePanel() {
  const container = document.getElementById(PANEL_CONTAINER_ID);
  if (container) {
    if (currentRoot) {
      currentRoot.unmount();
      currentRoot = null;
    }
    container.remove();
  }
}

// Main App component
const MarketMateApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    listing,
    analysis,
    preferences,
    panelExpanded,
    negotiation,
    setListing,
    analyzeCurrentListing,
    updatePreferences,
    togglePanel,
    startNegotiation,
    getNextSuggestion,
    reset,
  } = useStore();

  // Initialize on mount and watch for URL changes
  React.useEffect(() => {
    const initialize = () => {
      // Double-check we're on a listing page before extracting
      if (!isListingPage()) {
        return;
      }

      console.log("MarketMate: Extracting listing data...");
      const data = preferences.mockMode
        ? getMockListingData()
        : extractListingData();
      setListing(data);

      if (data) {
        analyzeCurrentListing();
        // Reset maxSpend for new listing
        updatePreferences({ maxSpend: Math.round(data.askingPrice * 0.85) });
        console.log(
          "MarketMate: Listing loaded -",
          data.title,
          "at $" + data.askingPrice
        );
      }
    };

    // Initial extraction
    initialize();
    lastUrl = window.location.href;

    // Watch for URL changes (SPA navigation)
    const checkUrlChange = () => {
      if (window.location.href !== lastUrl) {
        console.log("MarketMate: URL changed to", window.location.pathname);
        lastUrl = window.location.href;

        // Check if still on a listing page
        if (isListingPage()) {
          // Small delay to let the page load
          setTimeout(() => {
            reset();
            initialize();
          }, 800);
        } else {
          // Not on a listing page anymore, close panel
          onClose();
        }
      }
    };

    // Poll for URL changes (works better than popstate for SPA)
    const urlInterval = setInterval(checkUrlChange, 500);

    return () => {
      clearInterval(urlInterval);
    };
  }, [preferences.mockMode]);

  // Don't render if no listing detected
  if (!listing) {
    return null;
  }

  const handleSuggestMessage = () => {
    let messageText: string;

    // If no negotiation started, start one and generate initial message
    if (!negotiation && analysis) {
      const offer = preferences.maxSpend || analysis.recommendedOffer;
      startNegotiation(analysis.recommendedOffer, offer);

      // Generate initial offer message directly
      const message = generateMessage(
        "initial",
        preferences.style,
        analysis.recommendedOffer
      );
      messageText = message.text;
    } else {
      // Use existing negotiation flow
      const suggestion = getNextSuggestion();
      if (!suggestion) {
        // Fallback: generate a simple initial message
        const offer =
          preferences.maxSpend ||
          analysis?.recommendedOffer ||
          Math.round(listing.askingPrice * 0.85);
        const message = generateMessage("initial", preferences.style, offer);
        messageText = message.text;
      } else {
        messageText = suggestion.text;
      }
    }

    // Copy to clipboard and show feedback
    navigator.clipboard
      .writeText(messageText)
      .then(() => {
        console.log("MarketMate: Message copied:", messageText);
        showToast("✓ Message copied to clipboard!");
      })
      .catch((err) => {
        console.error("MarketMate: Failed to copy", err);
        showToast("Failed to copy message", "error");
      });
  };

  // Selectors for Messenger input area (Facebook embedded chat)
  const MESSENGER_INPUT_SELECTORS = [
    '[data-testid="messenger-input-box"]',
    '[role="textbox"][contenteditable="true"]',
    ".notranslate._5rpu",
    'div[aria-label*="Message"]',
    '[aria-label="Message"][role="textbox"]',
  ];

  // Find Messenger input box
  const findMessengerInput = (): HTMLElement | null => {
    for (const selector of MESSENGER_INPUT_SELECTORS) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) return element;
    }
    return null;
  };

  // Check if messenger chat is open
  const messengerInput = findMessengerInput();
  const isMessengerOpen = messengerInput !== null;

  const handleSendOffer = () => {
    if (!analysis) return;

    const offer = preferences.maxSpend || analysis.recommendedOffer;
    startNegotiation(analysis.recommendedOffer, offer);

    // Check if messenger is open
    const input = findMessengerInput();

    if (input) {
      // Generate the message
      const message = generateMessage("initial", preferences.style, offer);

      // Insert message into chat input
      input.focus();

      // Use execCommand for contenteditable divs
      document.execCommand("insertText", false, message.text);

      // Trigger input event
      input.dispatchEvent(new Event("input", { bubbles: true }));

      showToast("✓ Message inserted into chat!");
    } else {
      // Try to click the "Message" or "Send Message" button on the page
      const messageButton = document.querySelector<HTMLElement>(
        '[aria-label="Message"], [aria-label="Send message"], button[data-testid*="message"]'
      );

      if (messageButton) {
        messageButton.click();
        showToast("Opening message dialog...");
      } else {
        showToast("Click 'Message' to start chatting with seller");
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <MarketplacePanel
      askingPrice={listing.askingPrice}
      analysis={analysis}
      preferences={preferences}
      expanded={panelExpanded}
      isMessengerOpen={isMessengerOpen}
      onToggle={togglePanel}
      onMaxPriceChange={(value) => updatePreferences({ maxSpend: value })}
      onStyleChange={(style) => updatePreferences({ style })}
      onSuggestMessage={handleSuggestMessage}
      onSendOffer={handleSendOffer}
      onClose={handleClose}
    />
  );
};

// Initialize the panel on a listing page
function initPanel() {
  // Remove any existing panel first
  removePanel();

  console.log("MarketMate: Initializing on listing page");

  // Visual indicator
  const indicator = document.createElement("div");
  indicator.style.cssText =
    "position:fixed;top:10px;left:10px;background:#4CAF50;color:white;padding:10px 15px;border-radius:8px;z-index:999999;font-family:system-ui;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.3);";
  indicator.textContent = "✓ MarketMate Loaded";
  document.body.appendChild(indicator);
  setTimeout(() => indicator.remove(), 2000);

  const container = createPanelContainer();
  currentRoot = createRoot(container);
  lastUrl = window.location.href;

  currentRoot.render(
    <React.StrictMode>
      <MarketMateApp onClose={removePanel} />
    </React.StrictMode>
  );
}

// Watch for navigation to listing pages
function watchForListingPage() {
  if (navigationInterval) {
    clearInterval(navigationInterval);
  }

  navigationInterval = setInterval(() => {
    if (isListingPage()) {
      clearInterval(navigationInterval!);
      navigationInterval = null;
      // Small delay to let page content load
      setTimeout(initPanel, 500);
    }
  }, 500);
}

// Main initialization
function init() {
  console.log("MarketMate: Content script loaded on", window.location.pathname);

  if (isListingPage()) {
    // We're on a listing page, initialize the panel
    // Small delay to ensure page content is loaded
    setTimeout(initPanel, 500);
  } else {
    // Not on a listing page, watch for navigation
    console.log("MarketMate: Watching for navigation to listing page...");
    watchForListingPage();
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
