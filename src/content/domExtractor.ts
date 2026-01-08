// DOM Extraction for Facebook Marketplace Listings

import type { ListingData } from "../types";

// Selector strategies - Facebook changes DOM frequently, so we use multiple fallbacks
// These are ordered by specificity - most specific first
const SELECTORS = {
  // Price is usually in a prominent span with $ symbol
  price: [
    '[data-testid="marketplace_listing_price"]',
    // Look for spans containing $ that are likely prices
    'span[class*="x1lliihq"][class*="x6ikm8r"]',
    'span[class*="x193iq5w"][class*="xeuugli"]',
  ],
  // Title is usually the first h1 or prominent span
  title: [
    '[data-testid="marketplace_listing_title"]',
    'h1 span[class*="x193iq5w"]',
    "h1",
    'span[class*="x1heor9g"][class*="x1qlqyl8"]',
  ],
  // Description area
  description: [
    '[data-testid="marketplace_listing_description"]',
    'div[data-ad-preview="message"]',
    'span[class*="x193iq5w"][class*="xeuugli"][class*="x1fj9vlw"]',
  ],
  // Location text usually contains city, state
  location: [
    '[data-testid="marketplace_listing_location"]',
    'span[class*="x1lliihq"][class*="x6ikm8r"]',
  ],
  // Condition field
  condition: ['[data-testid="marketplace_listing_condition"]'],
  // Time listed text
  timeListed: ['[data-testid="marketplace_listing_time"]', "abbr[data-utime]"],
  // Category link
  category: [
    '[data-testid="marketplace_listing_category"]',
    'a[href*="/marketplace/category/"]',
  ],
  // Seller name
  sellerName: [
    '[data-testid="marketplace_seller_name"]',
    'a[href*="/marketplace/profile/"] span',
    'span[class*="x193iq5w"][class*="xeuugli"][class*="x1fj9vlw"]',
  ],
  // Seller profile link
  sellerProfile: [
    'a[href*="/marketplace/profile/"]',
    'a[href*="facebook.com"][class*="x1i10hfl"]',
  ],
  // Images
  images: [
    '[data-testid="marketplace_listing_image"] img',
    'img[data-visualcompletion="media-vc-image"]',
    'img[class*="x1lliihq"]',
  ],
};

// Condition keywords that indicate product state
const CONDITION_KEYWORDS = {
  excellent: [
    "like new",
    "mint",
    "excellent",
    "perfect",
    "pristine",
    "brand new",
    "sealed",
  ],
  good: ["good", "great", "works perfectly", "fully functional", "clean"],
  fair: ["fair", "used", "some wear", "minor scratches", "small dent"],
  poor: [
    "broken",
    "damaged",
    "parts only",
    "for parts",
    "not working",
    "needs repair",
  ],
};

// Urgency indicators suggesting seller flexibility
const URGENCY_KEYWORDS = [
  "must sell",
  "moving",
  "need gone",
  "obo",
  "or best offer",
  "negotiable",
  "make offer",
  "asap",
  "quick sale",
  "desperate",
  "price drop",
  "reduced",
  "firm",
  "no lowballers",
];

/**
 * Try multiple selectors until one works
 */
function querySelector(selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) return element;
    } catch {
      // Invalid selector, try next
    }
  }
  return null;
}

/**
 * Extract text content from element
 */
function getTextContent(selectors: string[]): string {
  const element = querySelector(selectors);
  return element?.textContent?.trim() || "";
}

/**
 * Parse price from text (handles $, comma, decimals)
 */
function parsePrice(priceText: string): number {
  const match = priceText.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ""));
  }
  return 0;
}

/**
 * Parse time listed text into days
 */
function parseDaysListed(timeText: string): number {
  const lowerText = timeText.toLowerCase();

  // Just listed / today
  if (
    lowerText.includes("just") ||
    lowerText.includes("today") ||
    lowerText.includes("hour")
  ) {
    return 0;
  }

  // Yesterday
  if (lowerText.includes("yesterday")) {
    return 1;
  }

  // X days ago
  const daysMatch = lowerText.match(/(\d+)\s*days?/);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }

  // X weeks ago
  const weeksMatch = lowerText.match(/(\d+)\s*weeks?/);
  if (weeksMatch) {
    return parseInt(weeksMatch[1], 10) * 7;
  }

  // X months ago
  const monthsMatch = lowerText.match(/(\d+)\s*months?/);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10) * 30;
  }

  return 0;
}

/**
 * Detect condition from text
 */
function detectCondition(text: string): {
  condition: string;
  keywords: string[];
} {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];

  for (const [condition, keywords] of Object.entries(CONDITION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        foundKeywords.push(keyword);
        if (foundKeywords.length === 1) {
          return { condition, keywords: foundKeywords };
        }
      }
    }
  }

  // Default to 'used' if no keywords found
  return {
    condition: foundKeywords.length > 0 ? "mixed" : "used",
    keywords: foundKeywords,
  };
}

/**
 * Find urgency indicators in text
 */
function findUrgencyIndicators(text: string): string[] {
  const lowerText = text.toLowerCase();
  return URGENCY_KEYWORDS.filter((keyword) => lowerText.includes(keyword));
}

/**
 * Extract listing ID from URL
 */
function extractListingId(): string {
  const match = window.location.pathname.match(/\/marketplace\/item\/(\d+)/);
  return match ? match[1] : `listing-${Date.now()}`;
}

/**
 * Extract all listing images
 */
function extractImages(): string[] {
  const images: string[] = [];

  for (const selector of SELECTORS.images) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((img) => {
        const src = (img as HTMLImageElement).src;
        if (src && !images.includes(src)) {
          images.push(src);
        }
      });
    } catch {
      // Invalid selector, continue
    }
  }

  return images;
}

/**
 * Find price by searching for $ symbol in the page
 */
function findPriceInPage(): number {
  // Look for elements containing price patterns
  const allSpans = document.querySelectorAll("span");
  for (const span of allSpans) {
    const text = span.textContent?.trim() || "";
    // Match price pattern like $300 or $1,500
    const priceMatch = text.match(/^\$[\d,]+$/);
    if (priceMatch) {
      return parsePrice(text);
    }
  }
  return 0;
}

/**
 * Find title - usually the largest/most prominent text
 */
function findTitleInPage(): string {
  // Try h1 first
  const h1 = document.querySelector("h1");
  if (h1?.textContent?.trim()) {
    return h1.textContent.trim();
  }

  // Look for prominent spans in the right sidebar (Facebook layout)
  const mainContent = document.querySelector('[role="main"]');
  if (mainContent) {
    const spans = mainContent.querySelectorAll("span");
    for (const span of spans) {
      const text = span.textContent?.trim() || "";
      // Title is usually substantial but not too long, and not a price
      if (
        text.length > 5 &&
        text.length < 100 &&
        !text.startsWith("$") &&
        !text.includes("Listed")
      ) {
        // Check if it looks like a product title
        const style = window.getComputedStyle(span);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize >= 18) {
          return text;
        }
      }
    }
  }
  return "";
}

/**
 * Find listing details from the page
 */
function findListingDetails(): {
  condition: string;
  location: string;
  daysListed: number;
  description: string;
} {
  let condition = "";
  let location = "";
  let daysListed = 0;
  let description = "";

  // Get all text content and search for patterns
  const bodyText = document.body.innerText;

  // Find "Listed X days ago" pattern
  const listedMatch = bodyText.match(
    /Listed\s+(\d+)\s+(day|week|month)s?\s+ago/i
  );
  if (listedMatch) {
    const num = parseInt(listedMatch[1], 10);
    const unit = listedMatch[2].toLowerCase();
    if (unit === "day") daysListed = num;
    else if (unit === "week") daysListed = num * 7;
    else if (unit === "month") daysListed = num * 30;
  }

  // Find condition
  const conditionMatch = bodyText.match(/Condition\s*[:\-]?\s*([\w\s\-]+)/i);
  if (conditionMatch) {
    condition = conditionMatch[1].trim();
  }

  // Find location (City, STATE pattern)
  const locationMatch = bodyText.match(
    /(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/
  );
  if (locationMatch) {
    location = locationMatch[1];
  }

  // Try to extract description - look for longer text blocks
  const allDivs = document.querySelectorAll("div, span");
  for (const el of allDivs) {
    const text = el.textContent?.trim() || "";
    if (
      text.length > 50 &&
      text.length < 1000 &&
      !text.includes("Listed") &&
      !text.includes("Seller information")
    ) {
      // Check if this looks like a description (has sentences)
      if (text.includes(".") || text.includes("!") || text.length > 100) {
        if (text.length > description.length) {
          description = text;
        }
      }
    }
  }

  return { condition, location, daysListed, description };
}

/**
 * Find seller name
 */
function findSellerName(): string {
  // Look for seller info section
  const sellerSection = Array.from(document.querySelectorAll("span")).find(
    (el) => el.textContent?.includes("Seller information")
  );

  if (sellerSection) {
    // The name is usually a nearby link
    const parent = sellerSection.closest("div");
    if (parent) {
      const link = parent.querySelector('a[href*="facebook.com"]');
      if (link?.textContent?.trim()) {
        return link.textContent.trim();
      }
    }
  }

  // Fallback: look for profile links
  const profileLinks = document.querySelectorAll("a");
  for (const link of profileLinks) {
    const href = link.getAttribute("href") || "";
    if (
      href.includes("/marketplace/profile/") ||
      href.includes("facebook.com/")
    ) {
      const text = link.textContent?.trim() || "";
      if (
        text &&
        text.length > 2 &&
        text.length < 50 &&
        !text.includes("http")
      ) {
        return text;
      }
    }
  }

  return "";
}

/**
 * Main extraction function - reads real DOM

 */
export function extractListingData(): ListingData | null {
  try {
    console.log("MarketMate: Attempting to extract listing data...");

    // Try selector-based extraction first, then fallback to smart search
    let priceText = getTextContent(SELECTORS.price);
    let askingPrice = parsePrice(priceText);

    // Fallback: search page for price
    if (!askingPrice) {
      console.log("MarketMate: Using fallback price search...");
      askingPrice = findPriceInPage();
    }

    if (!askingPrice) {
      console.warn("MarketMate: Could not extract price from page");
      return null;
    }

    console.log("MarketMate: Found price:", askingPrice);

    // Title - try selectors then fallback
    let title = getTextContent(SELECTORS.title);
    if (!title) {
      title = findTitleInPage();
    }
    console.log("MarketMate: Found title:", title);

    // Get additional details using smart search
    const details = findListingDetails();

    // Description
    let description = getTextContent(SELECTORS.description);
    if (!description) {
      description = details.description;
    }

    // Full text for analysis
    const fullText = `${title} ${description}`;

    // Location
    let location = getTextContent(SELECTORS.location);
    if (!location) {
      location = details.location;
    }

    // Time listed
    let daysListed = 0;
    const timeListedText = getTextContent(SELECTORS.timeListed);
    if (timeListedText) {
      daysListed = parseDaysListed(timeListedText);
    } else {
      daysListed = details.daysListed;
    }

    // Category
    const category = getTextContent(SELECTORS.category);

    // Condition - from details or detect from text
    let condition = details.condition;
    let conditionKeywords: string[] = [];
    if (!condition) {
      const detected = detectCondition(fullText);
      condition = detected.condition;
      conditionKeywords = detected.keywords;
    } else {
      conditionKeywords = [condition.toLowerCase()];
    }

    // Urgency
    const urgencyIndicators = findUrgencyIndicators(fullText);

    // Seller info
    let sellerName = getTextContent(SELECTORS.sellerName);
    if (!sellerName) {
      sellerName = findSellerName();
    }
    const sellerProfileElement = querySelector(SELECTORS.sellerProfile);
    const sellerProfileUrl = sellerProfileElement?.getAttribute("href") || "";

    // Images
    const images = extractImages();

    const listingData = {
      id: extractListingId(),
      title,
      description,
      askingPrice,
      currency: "USD",
      category,
      location,
      timeListed:
        daysListed > 0
          ? new Date(Date.now() - daysListed * 24 * 60 * 60 * 1000)
          : null,
      daysListed,
      condition,
      conditionKeywords,
      urgencyIndicators,
      sellerName,
      sellerProfileUrl,
      images,
      url: window.location.href,
    };

    console.log("MarketMate: Extracted listing data:", listingData);
    return listingData;
  } catch (error) {
    console.error("MarketMate: Error extracting listing data", error);
    return null;
  }
}

/**
 * Mock data for testing/offline development
 */
export function getMockListingData(): ListingData {
  return {
    id: "mock-123456",
    title: "Sony PlayStation 5 Console",
    description:
      "Used PS5 in great condition. Includes one controller and all cables. Must sell, moving next week. No lowballers please.",
    askingPrice: 250,
    currency: "USD",
    category: "Electronics",
    location: "San Francisco, CA",
    timeListed: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    daysListed: 18,
    condition: "good",
    conditionKeywords: ["great condition"],
    urgencyIndicators: ["must sell", "moving", "no lowballers"],
    sellerName: "John D.",
    sellerProfileUrl: "/marketplace/profile/123456",
    images: ["https://example.com/image1.jpg"],
    url: "https://www.facebook.com/marketplace/item/123456",
  };
}

/**
 * Observe DOM for listing changes (SPA navigation)
 */
export function observeListingChanges(
  callback: (listing: ListingData | null) => void
): MutationObserver {
  const observer = new MutationObserver(() => {
    // Debounce to avoid excessive calls
    setTimeout(() => {
      const listing = extractListingData();
      callback(listing);
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

export { CONDITION_KEYWORDS, URGENCY_KEYWORDS };
