// Types for MarketMate Extension

export interface ListingData {
  id: string;
  title: string;
  description: string;
  askingPrice: number;
  currency: string;
  category: string;
  location: string;
  timeListed: Date | null;
  daysListed: number;
  condition: string;
  conditionKeywords: string[];
  urgencyIndicators: string[];
  sellerName: string;
  sellerProfileUrl: string;
  images: string[];
  url: string;
}

export interface PriceAnalysis {
  fairValueMin: number;
  fairValueMax: number;
  recommendedOffer: number;
  flexibility: 'low' | 'medium' | 'high';
  confidenceScore: number;
  factors: PriceFactor[];
}

export interface PriceFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export type NegotiationStyle = 'polite' | 'neutral' | 'firm';
export type AutomationLevel = 'suggest-only' | 'one-click-send';

export interface UserPreferences {
  maxSpend: number;
  style: NegotiationStyle;
  automationLevel: AutomationLevel;
  mockMode: boolean;
}

export type NegotiationState = 
  | 'INIT'
  | 'OFFER_SENT'
  | 'AWAITING_RESPONSE'
  | 'COUNTER_RECEIVED'
  | 'COUNTER_SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WALKED_AWAY';

export interface NegotiationSession {
  id: string;
  listingId: string;
  state: NegotiationState;
  initialOffer: number;
  currentOffer: number;
  maxPrice: number;
  counterHistory: CounterOffer[];
  messages: NegotiationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CounterOffer {
  amount: number;
  fromSeller: boolean;
  timestamp: Date;
}

export interface NegotiationMessage {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: Date;
  sent: boolean;
}

export interface SuggestedMessage {
  text: string;
  type: 'initial' | 'counter' | 'accept' | 'walkaway';
  confidence: 'high' | 'medium' | 'low';
  offerAmount?: number;
}

export interface ExtensionState {
  listing: ListingData | null;
  analysis: PriceAnalysis | null;
  preferences: UserPreferences;
  negotiation: NegotiationSession | null;
  panelExpanded: boolean;
  loading: boolean;
  error: string | null;
}

// Message types for communication between content script and background
export type MessageType =
  | 'GET_LISTING_DATA'
  | 'ANALYZE_PRICE'
  | 'GENERATE_MESSAGE'
  | 'SEND_MESSAGE'
  | 'UPDATE_PREFERENCES'
  | 'GET_STATE'
  | 'UPDATE_NEGOTIATION_STATE';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
