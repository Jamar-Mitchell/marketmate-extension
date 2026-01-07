// Zustand store for MarketMate state management

import { create } from 'zustand';
import type {
  ExtensionState,
  ListingData,
  PriceAnalysis,
  UserPreferences,
  NegotiationSession,
  NegotiationStyle,
} from '../types';
import { analyzePricing, getMockAnalysis } from '../engine/pricingEngine';
import { createSession, transitionState, addCounterOffer, generateMessage, determineNextAction } from '../engine/negotiationEngine';

interface StoreActions {
  setListing: (listing: ListingData | null) => void;
  setAnalysis: (analysis: PriceAnalysis | null) => void;
  analyzeCurrentListing: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  togglePanel: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  startNegotiation: (initialOffer: number, maxPrice: number) => void;
  updateNegotiationState: (state: NegotiationSession['state']) => void;
  addSellerCounter: (amount: number) => void;
  getNextSuggestion: () => ReturnType<typeof generateMessage> | null;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  maxSpend: 0,
  style: 'polite',
  automationLevel: 'suggest-only',
  mockMode: false,
};

const initialState: ExtensionState = {
  listing: null,
  analysis: null,
  preferences: DEFAULT_PREFERENCES,
  negotiation: null,
  panelExpanded: false,
  loading: false,
  error: null,
};

export const useStore = create<ExtensionState & StoreActions>((set, get) => ({
  ...initialState,

  setListing: (listing) => set({ listing }),

  setAnalysis: (analysis) => set({ analysis }),

  analyzeCurrentListing: () => {
    const { listing, preferences } = get();
    
    if (!listing) {
      set({ analysis: null });
      return;
    }

    if (preferences.mockMode) {
      set({ analysis: getMockAnalysis() });
      return;
    }

    const analysis = analyzePricing(listing);
    set({ analysis });
  },

  updatePreferences: (prefs) => {
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    }));
  },

  togglePanel: () => {
    set((state) => ({ panelExpanded: !state.panelExpanded }));
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  startNegotiation: (initialOffer, maxPrice) => {
    const { listing } = get();
    if (!listing) return;

    const session = createSession(listing.id, initialOffer, maxPrice);
    set({ negotiation: session });
  },

  updateNegotiationState: (newState) => {
    const { negotiation } = get();
    if (!negotiation) return;

    const updated = transitionState(negotiation, newState);
    set({ negotiation: updated });
  },

  addSellerCounter: (amount) => {
    const { negotiation } = get();
    if (!negotiation) return;

    const updated = addCounterOffer(negotiation, amount, true);
    set({ negotiation: updated });
  },

  getNextSuggestion: () => {
    const { negotiation, analysis, preferences } = get();
    if (!negotiation) return null;

    const lastCounter = negotiation.counterHistory.length > 0
      ? negotiation.counterHistory[negotiation.counterHistory.length - 1]
      : null;

    const sellerCounter = lastCounter?.fromSeller ? lastCounter.amount : undefined;
    const { action, amount } = determineNextAction(negotiation, sellerCounter, analysis || undefined);

    const messageType = action === 'accept' ? 'accept' :
                        action === 'walkaway' ? 'walkaway' :
                        negotiation.state === 'INIT' ? 'initial' : 'counter';

    return generateMessage(messageType, preferences.style, amount);
  },

  reset: () => set(initialState),
}));

// Selector hooks for common patterns
export const useListingData = () => useStore((state) => state.listing);
export const usePriceAnalysis = () => useStore((state) => state.analysis);
export const usePreferences = () => useStore((state) => state.preferences);
export const useNegotiation = () => useStore((state) => state.negotiation);
export const usePanelExpanded = () => useStore((state) => state.panelExpanded);
