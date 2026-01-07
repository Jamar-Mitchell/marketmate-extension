// Negotiation State Machine for MarketMate

import type {
  NegotiationState,
  NegotiationSession,
  NegotiationStyle,
  SuggestedMessage,
  CounterOffer,
  PriceAnalysis,
} from '../types';

/**
 * State transition rules
 */
const STATE_TRANSITIONS: Record<NegotiationState, NegotiationState[]> = {
  INIT: ['OFFER_SENT', 'WALKED_AWAY'],
  OFFER_SENT: ['AWAITING_RESPONSE'],
  AWAITING_RESPONSE: ['COUNTER_RECEIVED', 'ACCEPTED', 'REJECTED'],
  COUNTER_RECEIVED: ['COUNTER_SENT', 'ACCEPTED', 'WALKED_AWAY'],
  COUNTER_SENT: ['AWAITING_RESPONSE'],
  ACCEPTED: [],
  REJECTED: [],
  WALKED_AWAY: [],
};

/**
 * Check if state transition is valid
 */
export function canTransition(from: NegotiationState, to: NegotiationState): boolean {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create new negotiation session
 */
export function createSession(
  listingId: string,
  initialOffer: number,
  maxPrice: number
): NegotiationSession {
  return {
    id: `neg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    listingId,
    state: 'INIT',
    initialOffer,
    currentOffer: initialOffer,
    maxPrice,
    counterHistory: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Transition to new state
 */
export function transitionState(
  session: NegotiationSession,
  newState: NegotiationState
): NegotiationSession {
  if (!canTransition(session.state, newState)) {
    throw new Error(`Invalid state transition: ${session.state} -> ${newState}`);
  }
  
  return {
    ...session,
    state: newState,
    updatedAt: new Date(),
  };
}

/**
 * Add counter offer to session
 */
export function addCounterOffer(
  session: NegotiationSession,
  amount: number,
  fromSeller: boolean
): NegotiationSession {
  const counter: CounterOffer = {
    amount,
    fromSeller,
    timestamp: new Date(),
  };
  
  return {
    ...session,
    counterHistory: [...session.counterHistory, counter],
    currentOffer: fromSeller ? session.currentOffer : amount,
    updatedAt: new Date(),
  };
}

/**
 * Check if we should walk away (max price exceeded)
 */
export function shouldWalkAway(session: NegotiationSession, sellerCounter: number): boolean {
  return sellerCounter > session.maxPrice;
}

/**
 * Calculate next counter offer
 */
export function calculateNextOffer(
  session: NegotiationSession,
  sellerCounter: number,
  analysis: PriceAnalysis
): number {
  const { maxPrice, currentOffer } = session;
  
  // Don't go above max price
  if (sellerCounter <= maxPrice) {
    // Seller's offer is acceptable
    return sellerCounter;
  }
  
  // Calculate midpoint between our last offer and their counter
  const midpoint = Math.round((currentOffer + sellerCounter) / 2);
  
  // But don't exceed our max
  const nextOffer = Math.min(midpoint, maxPrice);
  
  // And ensure we're making progress (at least $5 increase)
  if (nextOffer <= currentOffer) {
    return Math.min(currentOffer + 5, maxPrice);
  }
  
  // Consider fair value - don't go way above it
  const fairCeiling = analysis.fairValueMax * 1.1;
  return Math.min(nextOffer, fairCeiling, maxPrice);
}

/**
 * Message templates by style
 */
const MESSAGE_TEMPLATES = {
  initial: {
    polite: [
      "Hi! I'm really interested in this item. Would you consider ${offer} if I can pick up today?",
      "Hey there! Love what you're selling. Any chance you'd take ${offer}? I can be flexible on pickup time.",
      "Hi! This looks great. I was hoping to spend around ${offer} - would that work for you?",
    ],
    neutral: [
      "Interested in this. Would you take ${offer}?",
      "Hi, I can offer ${offer} for this. Let me know.",
      "Is ${offer} a price you'd consider?",
    ],
    firm: [
      "I'll give you ${offer} cash today.",
      "I can do ${offer}. That's my budget for this.",
      "${offer} is what I can offer. Pickup whenever works for you.",
    ],
  },
  counter: {
    polite: [
      "I appreciate your response! ${offer} is the highest I can go right now. Totally understand if that doesn't work for you.",
      "Thanks for getting back to me. Would ${offer} work? I'm trying to stay within my budget.",
      "I hear you. Best I can do is ${offer}. Let me know what you think!",
    ],
    neutral: [
      "I can go up to ${offer}, that's my max.",
      "${offer} is my final offer. Let me know.",
      "Best I can do is ${offer}.",
    ],
    firm: [
      "${offer} is my limit. Take it or leave it.",
      "Can't go higher than ${offer}.",
      "My max is ${offer}. That's firm.",
    ],
  },
  accept: {
    polite: [
      "That works for me! When and where works best for you to meet?",
      "Deal! I'm excited. What time works for pickup?",
      "Perfect, I'll take it! Let me know the best time to come by.",
    ],
    neutral: [
      "Sounds good. When can I pick up?",
      "Deal. What's your availability?",
      "Works for me. When and where?",
    ],
    firm: [
      "Agreed. What's the pickup address?",
      "Done. Time and place?",
      "I'll take it. Details?",
    ],
  },
  walkaway: {
    polite: [
      "No worries at all - thanks for getting back to me. If anything changes, feel free to reach out!",
      "I understand, that's a bit above my budget right now. Best of luck with the sale!",
      "Thanks for your time! If you don't find a buyer at that price, I'd still be interested at ${offer}.",
    ],
    neutral: [
      "Thanks anyway. Good luck with the sale.",
      "That's above my budget. Thanks though.",
      "Can't do that price. Thanks for responding.",
    ],
    firm: [
      "That's too high for me. Good luck.",
      "Pass. Thanks anyway.",
      "Not at that price. Thanks.",
    ],
  },
};

/**
 * Generate message suggestion
 */
export function generateMessage(
  type: 'initial' | 'counter' | 'accept' | 'walkaway',
  style: NegotiationStyle,
  offerAmount?: number
): SuggestedMessage {
  const templates = MESSAGE_TEMPLATES[type][style];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const text = offerAmount 
    ? template.replace('${offer}', `$${offerAmount}`)
    : template;
  
  // Confidence based on type and style match
  const confidence = type === 'accept' ? 'high' :
                     type === 'initial' ? 'high' :
                     type === 'counter' ? 'medium' : 'medium';
  
  return {
    text,
    type,
    confidence,
    offerAmount,
  };
}

/**
 * Determine best action based on current state and seller response
 */
export function determineNextAction(
  session: NegotiationSession,
  sellerCounter?: number,
  analysis?: PriceAnalysis
): { action: 'counter' | 'accept' | 'walkaway'; amount?: number } {
  if (!sellerCounter) {
    return { action: 'counter', amount: session.initialOffer };
  }
  
  // Seller accepted our offer
  if (sellerCounter <= session.currentOffer) {
    return { action: 'accept' };
  }
  
  // Seller counter is within our max
  if (sellerCounter <= session.maxPrice) {
    return { action: 'accept' };
  }
  
  // Calculate if we should counter or walk away
  if (analysis) {
    const nextOffer = calculateNextOffer(session, sellerCounter, analysis);
    
    // If we can't improve meaningfully, walk away
    if (nextOffer >= session.maxPrice && session.currentOffer >= session.maxPrice * 0.95) {
      return { action: 'walkaway' };
    }
    
    return { action: 'counter', amount: nextOffer };
  }
  
  // No analysis, use simple logic
  if (session.counterHistory.length >= 3) {
    return { action: 'walkaway' };
  }
  
  const increment = Math.min(
    Math.round((session.maxPrice - session.currentOffer) / 2),
    20
  );
  
  if (increment < 5) {
    return { action: 'walkaway' };
  }
  
  return {
    action: 'counter',
    amount: Math.min(session.currentOffer + increment, session.maxPrice),
  };
}

/**
 * Check if negotiation is in terminal state
 */
export function isTerminalState(state: NegotiationState): boolean {
  return ['ACCEPTED', 'REJECTED', 'WALKED_AWAY'].includes(state);
}
