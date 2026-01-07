// Content Script Entry Point for Facebook Marketplace

import React from "react";
import { createRoot } from "react-dom/client";
import { MarketplacePanel } from "../components/MarketplacePanel";
import { useStore } from "../store";
import {
  extractListingData,
  getMockListingData,
  observeListingChanges,
} from "./domExtractor";
import "../styles/panel.css";

const PANEL_CONTAINER_ID = "marketmate-panel-root";

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

// Main App component
const MarketMateApp: React.FC = () => {
  const {
    listing,
    analysis,
    preferences,
    panelExpanded,
    setListing,
    analyzeCurrentListing,
    updatePreferences,
    togglePanel,
    startNegotiation,
    getNextSuggestion,
  } = useStore();

  // Initialize on mount
  React.useEffect(() => {
    const initialize = () => {
      const data = preferences.mockMode
        ? getMockListingData()
        : extractListingData();
      setListing(data);

      if (data) {
        analyzeCurrentListing();
        if (!preferences.maxSpend) {
          updatePreferences({ maxSpend: Math.round(data.askingPrice * 0.85) });
        }
      }
    };

    // Initial extraction
    initialize();

    // Watch for SPA navigation
    const observer = observeListingChanges((newListing) => {
      if (newListing && newListing.id !== listing?.id) {
        setListing(newListing);
        analyzeCurrentListing();
      }
    });

    return () => observer.disconnect();
  }, [preferences.mockMode]);

  // Don't render if no listing detected
  if (!listing) {
    return null;
  }

  const handleSuggestMessage = () => {
    const suggestion = getNextSuggestion();
    if (suggestion) {
      // Copy to clipboard
      navigator.clipboard.writeText(suggestion.text).then(() => {
        console.log("MarketMate: Message copied to clipboard");
      });
    }
  };

  const handleSendOffer = () => {
    if (!analysis) return;

    const offer = preferences.maxSpend || analysis.recommendedOffer;
    startNegotiation(analysis.recommendedOffer, offer);

    // Open Messenger conversation if possible
    const sellerLink = listing.sellerProfileUrl;
    if (sellerLink) {
      // Facebook's internal messaging could be triggered here
      console.log("MarketMate: Would open conversation with seller");
    }
  };

  return (
    <MarketplacePanel
      askingPrice={listing.askingPrice}
      analysis={analysis}
      preferences={preferences}
      expanded={panelExpanded}
      onToggle={togglePanel}
      onMaxPriceChange={(value) => updatePreferences({ maxSpend: value })}
      onStyleChange={(style) => updatePreferences({ style })}
      onSuggestMessage={handleSuggestMessage}
      onSendOffer={handleSendOffer}
    />
  );
};

// Initialize the extension
function init() {
  // Check if we're on a marketplace item page
  if (!window.location.pathname.includes("/marketplace/item/")) {
    console.log("MarketMate: Not on a listing page, waiting...");

    // Watch for navigation to listing pages
    const observer = new MutationObserver(() => {
      if (window.location.pathname.includes("/marketplace/item/")) {
        observer.disconnect();
        init();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return;
  }

  console.log("MarketMate: Initializing on marketplace listing");

  const container = createPanelContainer();
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MarketMateApp />
    </React.StrictMode>
  );
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
