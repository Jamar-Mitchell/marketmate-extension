// DOM Extraction for Facebook Marketplace Listings

import type { ListingData } from "../types";

// Selector strategies - Facebook changes DOM frequently, so we use multiple fallbacks
const SELECTORS = {
  price: [
    '[data-testid="marketplace_listing_price"]',
    'span[dir="auto"]:has-text("$")',
    ".x1lliihq.x6ikm8r.x10wlt62.x1n2onr6",
    "span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx",
  ],
  title: [
    '[data-testid="marketplace_listing_title"]',
    "h1 span",
    "span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09",
  ],
  description: [
    '[data-testid="marketplace_listing_description"]',
    'div[data-ad-preview="message"]',
    ".x1iorvi4.x1pi30zi.x1swvt13",
  ],
  location: [
    '[data-testid="marketplace_listing_location"]',
    'span:has-text("Listed in")',
    'a[href*="/marketplace/"][aria-label*="location"]',
  ],
  condition: [
    '[data-testid="marketplace_listing_condition"]',
    'span:has-text("Condition")',
  ],
  timeListed: [
    '[data-testid="marketplace_listing_time"]',
    'span:has-text("Listed")',
    "abbr[data-utime]",
  ],
  category: [
    '[data-testid="marketplace_listing_category"]',
    'a[href*="/marketplace/category/"]',
  ],
  sellerName: [
    '[data-testid="marketplace_seller_name"]',
    'a[href*="/marketplace/profile/"] span',
  ],
  sellerProfile: ['a[href*="/marketplace/profile/"]'],
  images: [
    '[data-testid="marketplace_listing_image"] img',
    'img[data-visualcompletion="media-vc-image"]',
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
 * Main extraction function - reads real DOM
 */
export function extractListingData(): ListingData | null {
  try {
    // Price
    const priceText = getTextContent(SELECTORS.price);
    const askingPrice = parsePrice(priceText);

    if (!askingPrice) {
      console.warn("MarketMate: Could not extract price");
      return null;
    }

    // Title
    const title = getTextContent(SELECTORS.title);

    // Description
    const description = getTextContent(SELECTORS.description);

    // Full text for analysis
    const fullText = `${title} ${description}`;

    // Location
    const location = getTextContent(SELECTORS.location);

    // Time listed
    const timeListedText = getTextContent(SELECTORS.timeListed);
    const daysListed = parseDaysListed(timeListedText);

    // Category
    const category = getTextContent(SELECTORS.category);

    // Condition
    const { condition, keywords: conditionKeywords } =
      detectCondition(fullText);

    // Urgency
    const urgencyIndicators = findUrgencyIndicators(fullText);

    // Seller info
    const sellerName = getTextContent(SELECTORS.sellerName);
    const sellerProfileElement = querySelector(SELECTORS.sellerProfile);
    const sellerProfileUrl = sellerProfileElement?.getAttribute("href") || "";

    // Images
    const images = extractImages();

    return {
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
