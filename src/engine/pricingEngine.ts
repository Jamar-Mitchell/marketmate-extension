// Pricing Heuristics Engine for MarketMate

import type { ListingData, PriceAnalysis, PriceFactor } from "../types";

/**
 * Category depreciation rates (per month)
 */
const CATEGORY_DEPRECIATION: Record<string, number> = {
  electronics: 0.05,
  vehicles: 0.02,
  furniture: 0.03,
  clothing: 0.08,
  appliances: 0.04,
  toys: 0.06,
  sports: 0.04,
  tools: 0.02,
  default: 0.04,
};

/**
 * Condition multipliers
 */
const CONDITION_MULTIPLIERS: Record<string, number> = {
  excellent: 0.95,
  good: 0.85,
  fair: 0.7,
  poor: 0.5,
  used: 0.75,
  mixed: 0.75,
};

/**
 * Calculate flexibility based on listing characteristics
 */
function calculateFlexibility(listing: ListingData): "low" | "medium" | "high" {
  let score = 0;

  // Days listed - older = more flexible
  if (listing.daysListed > 21) score += 3;
  else if (listing.daysListed > 14) score += 2;
  else if (listing.daysListed > 7) score += 1;

  // Urgency indicators
  const urgentKeywords = [
    "must sell",
    "moving",
    "desperate",
    "asap",
    "quick sale",
    "need gone",
  ];
  const firmKeywords = ["firm", "no lowballers", "price is firm"];

  const hasUrgent = listing.urgencyIndicators.some((ind) =>
    urgentKeywords.some((kw) => ind.toLowerCase().includes(kw))
  );
  const hasFirm = listing.urgencyIndicators.some((ind) =>
    firmKeywords.some((kw) => ind.toLowerCase().includes(kw))
  );

  if (hasUrgent) score += 2;
  if (hasFirm) score -= 2;

  // OBO or negotiable
  if (
    listing.urgencyIndicators.some((ind) =>
      ["obo", "or best offer", "negotiable", "make offer"].includes(
        ind.toLowerCase()
      )
    )
  ) {
    score += 2;
  }

  // Round price = potentially more flexible
  if (listing.askingPrice % 50 === 0) score += 1;
  if (listing.askingPrice % 100 === 0) score += 1;

  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

/**
 * Analyze listing and estimate fair price range
 */
export function analyzePricing(listing: ListingData): PriceAnalysis {
  const factors: PriceFactor[] = [];
  let adjustmentFactor = 1.0;

  // 1. Time on market factor
  const daysListed = listing.daysListed;
  if (daysListed > 0) {
    const timeDiscount = Math.min(daysListed * 0.005, 0.15); // Max 15% discount for time
    adjustmentFactor -= timeDiscount;

    factors.push({
      name: "Time on Market",
      impact: daysListed > 14 ? "positive" : "neutral",
      description: `Listed for ${daysListed} days`,
      weight: timeDiscount,
    });
  }

  // 2. Condition factor
  const conditionMultiplier =
    CONDITION_MULTIPLIERS[listing.condition] || CONDITION_MULTIPLIERS.used;
  const conditionDiscount = 1 - conditionMultiplier;
  adjustmentFactor -= conditionDiscount * 0.3; // Weight condition at 30%

  factors.push({
    name: "Condition",
    impact: conditionMultiplier >= 0.85 ? "negative" : "positive",
    description: `Condition: ${listing.condition}`,
    weight: conditionDiscount * 0.3,
  });

  // 3. Category depreciation
  const categoryLower = listing.category.toLowerCase();
  const depreciation =
    Object.entries(CATEGORY_DEPRECIATION).find(([cat]) =>
      categoryLower.includes(cat)
    )?.[1] || CATEGORY_DEPRECIATION.default;

  const monthsOld = Math.ceil(daysListed / 30);
  const categoryDiscount = Math.min(monthsOld * depreciation, 0.25);
  adjustmentFactor -= categoryDiscount * 0.2;

  factors.push({
    name: "Category Depreciation",
    impact: categoryDiscount > 0.1 ? "positive" : "neutral",
    description: `${listing.category || "General"} items depreciate`,
    weight: categoryDiscount * 0.2,
  });

  // 4. Urgency indicators
  const urgentCount = listing.urgencyIndicators.filter(
    (ind) => !["firm", "no lowballers"].includes(ind.toLowerCase())
  ).length;

  if (urgentCount > 0) {
    const urgencyDiscount = Math.min(urgentCount * 0.03, 0.1);
    adjustmentFactor -= urgencyDiscount;

    factors.push({
      name: "Seller Urgency",
      impact: "positive",
      description: `Seller shows ${urgentCount} urgency indicator(s)`,
      weight: urgencyDiscount,
    });
  }

  // 5. Price roundness (round prices often have more negotiation room)
  const priceRoundness =
    listing.askingPrice % 100 === 0
      ? 0.02
      : listing.askingPrice % 50 === 0
      ? 0.01
      : 0;
  if (priceRoundness > 0) {
    adjustmentFactor -= priceRoundness;

    factors.push({
      name: "Price Psychology",
      impact: "positive",
      description: "Round price suggests negotiation room",
      weight: priceRoundness,
    });
  }

  // Calculate ranges
  const flexibility = calculateFlexibility(listing);
  const baseDiscount = 1 - adjustmentFactor;

  // Fair value range
  const fairMax = Math.round(listing.askingPrice * (1 - baseDiscount * 0.5));
  const fairMin = Math.round(listing.askingPrice * (1 - baseDiscount * 1.2));

  // Recommended offer (aggressive but reasonable)
  const recommendedDiscount =
    flexibility === "high" ? 0.3 : flexibility === "medium" ? 0.25 : 0.2;
  const recommendedOffer = Math.round(
    listing.askingPrice * (1 - recommendedDiscount)
  );

  // Confidence based on data quality
  let confidenceScore = 0.5;
  if (listing.daysListed > 0) confidenceScore += 0.1;
  if (listing.condition !== "used") confidenceScore += 0.1;
  if (listing.urgencyIndicators.length > 0) confidenceScore += 0.1;
  if (listing.category) confidenceScore += 0.1;
  confidenceScore = Math.min(confidenceScore, 0.9);

  return {
    fairValueMin: Math.max(fairMin, Math.round(listing.askingPrice * 0.5)), // Floor at 50%
    fairValueMax: Math.min(fairMax, listing.askingPrice), // Cap at asking
    recommendedOffer: Math.max(
      recommendedOffer,
      Math.round(listing.askingPrice * 0.6)
    ),
    flexibility,
    confidenceScore,
    factors,
  };
}

/**
 * Get mock analysis for testing
 */
export function getMockAnalysis(): PriceAnalysis {
  return {
    fairValueMin: 190,
    fairValueMax: 215,
    recommendedOffer: 180,
    flexibility: "medium",
    confidenceScore: 0.75,
    factors: [
      {
        name: "Time on Market",
        impact: "positive",
        description: "Listed for 18 days",
        weight: 0.09,
      },
      {
        name: "Condition",
        impact: "neutral",
        description: "Condition: good",
        weight: 0.05,
      },
      {
        name: "Seller Urgency",
        impact: "positive",
        description: "Seller shows 2 urgency indicator(s)",
        weight: 0.06,
      },
      {
        name: "Price Psychology",
        impact: "positive",
        description: "Round price suggests negotiation room",
        weight: 0.02,
      },
    ],
  };
}
