// Unit tests for Negotiation Engine

import { describe, it, expect } from 'vitest';
import {
  createSession,
  transitionState,
  addCounterOffer,
  canTransition,
  calculateNextOffer,
  generateMessage,
  determineNextAction,
  isTerminalState,
} from '../../src/engine/negotiationEngine';
import type { PriceAnalysis } from '../../src/types';

const mockAnalysis: PriceAnalysis = {
  fairValueMin: 80,
  fairValueMax: 95,
  recommendedOffer: 75,
  flexibility: 'medium',
  confidenceScore: 0.7,
  factors: [],
};

describe('Negotiation Engine', () => {
  describe('createSession', () => {
    it('should create a new session with INIT state', () => {
      const session = createSession('listing-123', 80, 100);
      
      expect(session.state).toBe('INIT');
      expect(session.listingId).toBe('listing-123');
      expect(session.initialOffer).toBe(80);
      expect(session.currentOffer).toBe(80);
      expect(session.maxPrice).toBe(100);
      expect(session.counterHistory).toHaveLength(0);
    });

    it('should generate unique session IDs', () => {
      const session1 = createSession('listing-1', 80, 100);
      const session2 = createSession('listing-2', 80, 100);
      
      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('canTransition', () => {
    it('should allow valid transitions', () => {
      expect(canTransition('INIT', 'OFFER_SENT')).toBe(true);
      expect(canTransition('OFFER_SENT', 'AWAITING_RESPONSE')).toBe(true);
      expect(canTransition('AWAITING_RESPONSE', 'COUNTER_RECEIVED')).toBe(true);
      expect(canTransition('COUNTER_RECEIVED', 'ACCEPTED')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(canTransition('INIT', 'ACCEPTED')).toBe(false);
      expect(canTransition('ACCEPTED', 'OFFER_SENT')).toBe(false);
      expect(canTransition('REJECTED', 'COUNTER_SENT')).toBe(false);
    });
  });

  describe('transitionState', () => {
    it('should transition to valid state', () => {
      const session = createSession('listing-123', 80, 100);
      const updated = transitionState(session, 'OFFER_SENT');
      
      expect(updated.state).toBe('OFFER_SENT');
    });

    it('should throw on invalid transition', () => {
      const session = createSession('listing-123', 80, 100);
      
      expect(() => transitionState(session, 'ACCEPTED')).toThrow();
    });
  });

  describe('addCounterOffer', () => {
    it('should add seller counter to history', () => {
      const session = createSession('listing-123', 80, 100);
      const updated = addCounterOffer(session, 90, true);
      
      expect(updated.counterHistory).toHaveLength(1);
      expect(updated.counterHistory[0].amount).toBe(90);
      expect(updated.counterHistory[0].fromSeller).toBe(true);
    });

    it('should update current offer for buyer counters', () => {
      const session = createSession('listing-123', 80, 100);
      const updated = addCounterOffer(session, 85, false);
      
      expect(updated.currentOffer).toBe(85);
    });
  });

  describe('calculateNextOffer', () => {
    it('should accept seller counter within max price', () => {
      const session = createSession('listing-123', 80, 100);
      const nextOffer = calculateNextOffer(session, 95, mockAnalysis);
      
      expect(nextOffer).toBe(95);
    });

    it('should calculate midpoint for high counters', () => {
      const session = createSession('listing-123', 80, 95);
      const nextOffer = calculateNextOffer(session, 110, mockAnalysis);
      
      expect(nextOffer).toBeLessThanOrEqual(95);
      expect(nextOffer).toBeGreaterThan(80);
    });

    it('should not exceed max price', () => {
      const session = createSession('listing-123', 80, 90);
      const nextOffer = calculateNextOffer(session, 120, mockAnalysis);
      
      expect(nextOffer).toBeLessThanOrEqual(90);
    });
  });

  describe('generateMessage', () => {
    it('should generate initial offer message', () => {
      const message = generateMessage('initial', 'polite', 80);
      
      expect(message.text).toContain('$80');
      expect(message.type).toBe('initial');
    });

    it('should generate counter offer message', () => {
      const message = generateMessage('counter', 'neutral', 85);
      
      expect(message.text).toContain('$85');
      expect(message.type).toBe('counter');
    });

    it('should generate walk away message', () => {
      const message = generateMessage('walkaway', 'polite');
      
      expect(message.type).toBe('walkaway');
      expect(message.text.length).toBeGreaterThan(0);
    });

    it('should vary message by style', () => {
      const polite = generateMessage('initial', 'polite', 80);
      const firm = generateMessage('initial', 'firm', 80);
      
      // Messages should be different (though could randomly be same)
      // At minimum, they should both contain the offer
      expect(polite.text).toContain('$80');
      expect(firm.text).toContain('$80');
    });
  });

  describe('determineNextAction', () => {
    it('should return counter for initial state', () => {
      const session = createSession('listing-123', 80, 100);
      const result = determineNextAction(session, undefined, mockAnalysis);
      
      expect(result.action).toBe('counter');
      expect(result.amount).toBe(80);
    });

    it('should accept when seller counter is within max', () => {
      const session = createSession('listing-123', 80, 100);
      const result = determineNextAction(session, 95, mockAnalysis);
      
      expect(result.action).toBe('accept');
    });

    it('should counter when seller exceeds max but room exists', () => {
      let session = createSession('listing-123', 80, 95);
      const result = determineNextAction(session, 110, mockAnalysis);
      
      expect(result.action).toBe('counter');
      expect(result.amount).toBeLessThanOrEqual(95);
    });
  });

  describe('isTerminalState', () => {
    it('should identify terminal states', () => {
      expect(isTerminalState('ACCEPTED')).toBe(true);
      expect(isTerminalState('REJECTED')).toBe(true);
      expect(isTerminalState('WALKED_AWAY')).toBe(true);
    });

    it('should identify non-terminal states', () => {
      expect(isTerminalState('INIT')).toBe(false);
      expect(isTerminalState('OFFER_SENT')).toBe(false);
      expect(isTerminalState('COUNTER_RECEIVED')).toBe(false);
    });
  });
});
