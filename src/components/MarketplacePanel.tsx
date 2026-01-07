import React from 'react';
import type { PriceAnalysis, UserPreferences, NegotiationStyle } from '../../types';

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
}) => {
  const renderFlexibilityDots = (flexibility: 'low' | 'medium' | 'high') => {
    const dots = {
      low: ['filled', 'empty', 'empty'],
      medium: ['filled', 'filled', 'empty'],
      high: ['filled', 'filled', 'filled'],
    };
    
    return (
      <span className="mm-flexibility-dots">
        {dots[flexibility].map((type, i) => (
          <span key={i} className={`mm-dot mm-dot-${type}`}>●</span>
        ))}
      </span>
    );
  };

  if (!expanded) {
    return (
      <div className="mm-panel mm-panel-collapsed" data-testid="mm-panel-collapsed">
        <div className="mm-header" onClick={onToggle}>
          <span className="mm-logo">💬 MarketMate</span>
          <div className="mm-summary">
            <div>Asking: ${askingPrice}</div>
            {analysis && (
              <div>Fair: ${analysis.fairValueMin}–${analysis.fairValueMax}</div>
            )}
          </div>
          <button className="mm-expand-btn" data-testid="mm-expand-btn">
            View Deal Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-panel mm-panel-expanded" data-testid="mm-panel-expanded">
      <div className="mm-header" onClick={onToggle}>
        <span className="mm-logo">💬 MarketMate</span>
        <button className="mm-collapse-btn" data-testid="mm-collapse-btn">−</button>
      </div>
      
      <div className="mm-divider" />
      
      <div className="mm-content">
        <div className="mm-row">
          <span className="mm-label">Asking Price:</span>
          <span className="mm-value" data-testid="mm-asking-price">${askingPrice}</span>
        </div>
        
        {analysis && (
          <>
            <div className="mm-row">
              <span className="mm-label">Fair Value Range:</span>
              <span className="mm-value mm-fair-range" data-testid="mm-fair-range">
                ${analysis.fairValueMin}–${analysis.fairValueMax}
              </span>
            </div>
            
            <div className="mm-row">
              <span className="mm-label">Seller Flexibility:</span>
              <span className="mm-value" data-testid="mm-flexibility">
                {renderFlexibilityDots(analysis.flexibility)}
              </span>
            </div>
            
            <div className="mm-row">
              <span className="mm-label">Recommended Offer:</span>
              <span className="mm-value mm-recommended" data-testid="mm-recommended">
                ${analysis.recommendedOffer}
              </span>
            </div>
          </>
        )}
        
        <div className="mm-divider" />
        
        <div className="mm-input-group">
          <label className="mm-label">Max Price:</label>
          <div className="mm-slider-container">
            <span className="mm-slider-value">${preferences.maxSpend || analysis?.fairValueMax || askingPrice}</span>
            <input
              type="range"
              className="mm-slider"
              min={analysis?.fairValueMin || Math.round(askingPrice * 0.5)}
              max={askingPrice}
              value={preferences.maxSpend || analysis?.recommendedOffer || askingPrice}
              onChange={(e) => onMaxPriceChange(parseInt(e.target.value, 10))}
              data-testid="mm-max-price-slider"
            />
          </div>
        </div>
        
        <div className="mm-input-group">
          <label className="mm-label">Style:</label>
          <div className="mm-radio-group" data-testid="mm-style-selector">
            {(['polite', 'neutral', 'firm'] as NegotiationStyle[]).map((style) => (
              <label key={style} className="mm-radio-label">
                <input
                  type="radio"
                  name="style"
                  value={style}
                  checked={preferences.style === style}
                  onChange={() => onStyleChange(style)}
                />
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </label>
            ))}
          </div>
        </div>
        
        {analysis && analysis.factors.length > 0 && (
          <details className="mm-factors" data-testid="mm-factors">
            <summary>Why this price?</summary>
            <ul className="mm-factors-list">
              {analysis.factors.map((factor, i) => (
                <li key={i} className={`mm-factor mm-factor-${factor.impact}`}>
                  • {factor.description}
                </li>
              ))}
            </ul>
          </details>
        )}
        
        <div className="mm-actions">
          <button 
            className="mm-btn mm-btn-secondary"
            onClick={onSuggestMessage}
            data-testid="mm-suggest-btn"
          >
            Suggest Message
          </button>
          <button 
            className="mm-btn mm-btn-primary"
            onClick={onSendOffer}
            disabled={preferences.automationLevel === 'suggest-only'}
            data-testid="mm-send-btn"
          >
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePanel;
