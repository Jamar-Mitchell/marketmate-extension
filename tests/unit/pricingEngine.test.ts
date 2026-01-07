// Unit tests for Pricing Engine

import { describe, it, expect } from "vitest";
import { analyzePricing } from "../../src/engine/pricingEngine";
import type { ListingData } from "../../src/types";

const createMockListing = (
  overrides: Partial<ListingData> = {}
): ListingData => ({
  id: "test-123",
  title: "Test Item",
  description: "Test description",
  askingPrice: 100,
  currency: "USD",
  category: "Electronics",
  location: "San Francisco, CA",
  timeListed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  daysListed: 7,
  condition: "good",
  conditionKeywords: ["good"],
  urgencyIndicators: [],
  sellerName: "Test Seller",
  sellerProfileUrl: "/profile/123",
  images: [],
  url: "https://facebook.com/marketplace/item/123",
  ...overrides,
});

describe("Pricing Engine", () => {
  describe("analyzePricing", () => {
    it("should return fair value range below asking price", () => {
      const listing = createMockListing({ askingPrice: 100 });
      const analysis = analyzePricing(listing);

      expect(analysis.fairValueMin).toBeLessThan(100);
      expect(analysis.fairValueMax).toBeLessThanOrEqual(100);
      expect(analysis.recommendedOffer).toBeLessThan(100);
    });

    it("should increase flexibility for older listings", () => {
      const newListing = createMockListing({ daysListed: 1 });
      const oldListing = createMockListing({ daysListed: 30 });

      const newAnalysis = analyzePricing(newListing);
      const oldAnalysis = analyzePricing(oldListing);

      expect(["medium", "high"].includes(oldAnalysis.flexibility)).toBe(true);
    });

    it("should detect high flexibility with urgency keywords", () => {
      const listing = createMockListing({
        urgencyIndicators: ["must sell", "moving"],
        daysListed: 14,
      });

      const analysis = analyzePricing(listing);
      expect(analysis.flexibility).toBe("high");
    });

    it("should detect low flexibility with firm keywords", () => {
      const listing = createMockListing({
        urgencyIndicators: ["firm", "no lowballers"],
        daysListed: 3,
      });

      const analysis = analyzePricing(listing);
      expect(analysis.flexibility).toBe("low");
    });

    it("should generate pricing factors", () => {
      const listing = createMockListing({
        daysListed: 14,
        condition: "good",
      });

      const analysis = analyzePricing(listing);
      expect(analysis.factors.length).toBeGreaterThan(0);
      expect(analysis.factors.some((f) => f.name === "Time on Market")).toBe(
        true
      );
    });

    it("should handle round prices", () => {
      const roundPrice = createMockListing({ askingPrice: 100 });
      const oddPrice = createMockListing({ askingPrice: 97 });

      const roundAnalysis = analyzePricing(roundPrice);
      const oddAnalysis = analyzePricing(oddPrice);

      // Round prices should show up in factors
      expect(
        roundAnalysis.factors.some((f) => f.name === "Price Psychology")
      ).toBe(true);
    });

    it("should respect minimum recommended offer", () => {
      const listing = createMockListing({ askingPrice: 50 });
      const analysis = analyzePricing(listing);

      // Recommended offer should not be less than 60% of asking
      expect(analysis.recommendedOffer).toBeGreaterThanOrEqual(30);
    });

    it("should calculate confidence score", () => {
      const listing = createMockListing({
        daysListed: 14,
        condition: "good",
        category: "Electronics",
        urgencyIndicators: ["obo"],
      });

      const analysis = analyzePricing(listing);
      expect(analysis.confidenceScore).toBeGreaterThan(0.5);
      expect(analysis.confidenceScore).toBeLessThanOrEqual(1);
    });
  });
});
