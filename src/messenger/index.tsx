// Content Script Entry Point for Messenger

import React from "react";
import { createRoot } from "react-dom/client";
import { MessengerOverlay } from "../components/MessengerOverlay";
import { useStore } from "../store";
import "../styles/messenger.css";

const OVERLAY_CONTAINER_ID = "marketmate-messenger-root";

// Selectors for Messenger input area
const MESSENGER_INPUT_SELECTORS = [
  '[data-testid="messenger-input-box"]',
  '[role="textbox"][contenteditable="true"]',
  ".notranslate._5rpu",
  'div[aria-label*="Message"]',
];

// Find Messenger input box
function findMessengerInput(): Element | null {
  for (const selector of MESSENGER_INPUT_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

// Create container positioned above input
function createOverlayContainer(inputElement: Element): HTMLElement {
  let container = document.getElementById(OVERLAY_CONTAINER_ID);

  if (!container) {
    container = document.createElement("div");
    container.id = OVERLAY_CONTAINER_ID;
    container.style.cssText = "position: relative; z-index: 9999;";

    // Insert before the input's parent container
    const inputContainer =
      inputElement.closest('[role="main"]') || inputElement.parentElement;
    if (inputContainer) {
      inputContainer.insertBefore(
        container,
        inputElement.closest("form") || inputElement
      );
    } else {
      document.body.appendChild(container);
    }
  }

  return container;
}

// Main Messenger App component
const MessengerApp: React.FC = () => {
  const { negotiation, getNextSuggestion, updateNegotiationState } = useStore();

  const [suggestion, setSuggestion] = React.useState(getNextSuggestion());
  const [dismissed, setDismissed] = React.useState(false);

  // Check for active negotiation
  React.useEffect(() => {
    const checkNegotiation = async () => {
      // Check storage for active negotiation
      const stored = await chrome.storage.local.get(["currentNegotiation"]);
      if (stored.currentNegotiation) {
        // Could hydrate negotiation state here
        setSuggestion(getNextSuggestion());
      }
    };

    checkNegotiation();
  }, [negotiation]);

  const handleEdit = (text: string) => {
    if (suggestion) {
      setSuggestion({ ...suggestion, text });
    }
  };

  const handleSend = () => {
    if (!suggestion) return;

    // Find input and insert message
    const input = findMessengerInput();
    if (input) {
      // For contenteditable divs
      if (input instanceof HTMLElement) {
        input.focus();

        // Use execCommand for contenteditable
        document.execCommand("insertText", false, suggestion.text);

        // Trigger input event
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    // Update negotiation state
    if (suggestion.type === "initial") {
      updateNegotiationState("OFFER_SENT");
    } else if (suggestion.type === "counter") {
      updateNegotiationState("COUNTER_SENT");
    } else if (suggestion.type === "accept") {
      updateNegotiationState("ACCEPTED");
    } else if (suggestion.type === "walkaway") {
      updateNegotiationState("WALKED_AWAY");
    }

    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (dismissed || !suggestion) {
    return null;
  }

  // Get last seller counter from negotiation
  const lastCounter = negotiation?.counterHistory.find((c) => c.fromSeller);

  return (
    <MessengerOverlay
      suggestion={suggestion}
      sellerCounter={lastCounter?.amount}
      onEdit={handleEdit}
      onSend={handleSend}
      onDismiss={handleDismiss}
    />
  );
};

// Initialize the overlay
function init() {
  // Wait for Messenger input to appear
  const checkForInput = () => {
    const input = findMessengerInput();

    if (input) {
      console.log("MarketMate: Found Messenger input, initializing overlay");

      const container = createOverlayContainer(input);
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <MessengerApp />
        </React.StrictMode>
      );

      return true;
    }

    return false;
  };

  // Try immediately
  if (checkForInput()) return;

  // Watch for dynamic content
  const observer = new MutationObserver(() => {
    if (checkForInput()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Cleanup after 30 seconds if not found
  setTimeout(() => observer.disconnect(), 30000);
}

// Wait for DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
