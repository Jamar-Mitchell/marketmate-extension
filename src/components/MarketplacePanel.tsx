import React from "react";
import type {
  PriceAnalysis,
  UserPreferences,
  NegotiationStyle,
  PriceFactor,
} from "../types";

interface MarketplacePanelProps {
  askingPrice: number;
  analysis: PriceAnalysis | null;
  preferences: UserPreferences;
  expanded: boolean;
  onToggle: () => void;
  onMaxPriceChange: (value: number) => void;
  onStyleChange: (style: NegotiationStyle) => void;
  onSuggestMessage: () => void;
  onSendOffer: () => void;
  onClose: () => void;
}

export const MarketplacePanel: React.FC<MarketplacePanelProps> = ({
  askingPrice,
  analysis,
  preferences,
  expanded,
  onToggle,
  onMaxPriceChange,
  onStyleChange,
  onSuggestMessage,
  onSendOffer,
  onClose,
}) => {
  const renderFlexibilityDots = (flexibility: "low" | "medium" | "high") => {
    const dots = {
      low: ["filled", "empty", "empty"],
      medium: ["filled", "filled", "empty"],
      high: ["filled", "filled", "filled"],
    };

    return (
      <span className="mm-flexibility-dots">
        {dots[flexibility].map((type, i) => (
          <span key={i} className={`mm-dot mm-dot-${type}`}>
            ●
          </span>
        ))}
      </span>
    );
  };

  if (!expanded) {
    return (
      <div
        className="mm-panel mm-panel-collapsed"
        data-testid="mm-panel-collapsed"
      >
        <div className="mm-header">
          <button 
            className="mm-close-btn-small" 
            data-testid="mm-close-btn"
            onClick={onClose}
            title="Close MarketMate"
          >
            ✕
          </button>
          <div className="mm-header-content" onClick={onToggle}>
            <span className="mm-logo">MarketMate</span>
            <div className="mm-summary">
              <div>Asking: ${askingPrice}</div>
              {analysis && (
                <div>
                  Fair: ${analysis.fairValueMin}–${analysis.fairValueMax}
                </div>
              )}
            </div>
            <button className="mm-expand-btn" data-testid="mm-expand-btn">
              View Deal Insights
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-panel mm-panel-expanded" data-testid="mm-panel-expanded">
      <div className="mm-header">
        <span className="mm-logo" onClick={onToggle} style={{ cursor: 'pointer' }}>MarketMate</span>
        <div className="mm-header-buttons">
          <button 
            className="mm-collapse-btn" 
            data-testid="mm-collapse-btn"
            onClick={onToggle}
            title="Collapse"
          >
            −
          </button>
          <button 
            className="mm-close-btn" 
            data-testid="mm-close-btn"
            onClick={onClose}
            title="Close MarketMate"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="mm-divider" />
      
      <div className="mm-content">
        <div className="mm-row">
          <span className="mm-label">Asking Price</span>
          <span className="mm-value">${askingPrice}</span>
        </div>
        
        {analysis && (
          <>
            <div className="mm-row">
              <span className="mm-label">Fair Value Range</span>
              <span className="mm-fair-range">
                ${analysis.fairValueMin}–${analysis.fairValueMax}
              </span>
            </div>
            
            <div className="mm-row">
              <span className="mm-label">Recommended Offer</span>
              <span className="mm-recommended">${analysis.recommendedOffer}</span>
            </div>
            
            <div className="mm-row">
              <span className="mm-label">Seller Flexibility</span>
              {renderFlexibilityDots(analysis.flexibility)}
            </div>
            
            <details className="mm-factors">
              <summary>Price Factors</summary>
              <ul className="mm-factors-list">
                {analysis.factors.map((factor: PriceFactor, index: number) => (
                  <li key={index} className={`mm-factor mm-factor-${factor.impact}`}>
                    <span>{factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '✗' : '•'}</span>
                    <span>{factor.description}</span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
        
        <div className="mm-input-group">
          <label className="mm-label">Your Max Price</label>
          <div className="mm-slider-container">
            <span className="mm-slider-value">${preferences.maxSpend}</span>
            <input
              type="range"
              className="mm-slider"
              min={Math.round(askingPrice * 0.5)}
              max={askingPrice}
              value={preferences.maxSpend}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              data-testid="mm-max-price-slider"
            />
          </div>
        </div>
        
        <div className="mm-input-group">
          <label className="mm-label">Negotiation Style</label>
          <div className="mm-radio-group">
            {(['polite', 'neutral', 'firm'] as NegotiationStyle[]).map((style) => (
              <label key={style} className="mm-radio-label">
                <input
                  type="radio"
                  name="negotiation-style"
                  value={style}
                  checked={preferences.style === style}
                  onChange={() => onStyleChange(style)}
                  data-testid={`mm-style-${style}`}
                />
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </label>
            ))}
          </div>
        </div>
        
        <div className="mm-actions">
          <button
            className="mm-btn mm-btn-secondary"
            onClick={onSuggestMessage}
            data-testid="mm-suggest-btn"
          >
            Copy Message
          </button>
          <button
            className="mm-btn mm-btn-primary"
            onClick={onSendOffer}
            disabled={!analysis}
            data-testid="mm-send-offer-btn"
          >
            Open Messenger
          </button>
        </div>
      </div>
    </div>
  );
};
