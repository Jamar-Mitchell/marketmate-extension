import React, { useState } from 'react';
import type { SuggestedMessage } from '../../types';

interface MessengerOverlayProps {
  suggestion: SuggestedMessage | null;
  sellerCounter?: number;
  onEdit: (text: string) => void;
  onSend: () => void;
  onDismiss: () => void;
}

export const MessengerOverlay: React.FC<MessengerOverlayProps> = ({
  suggestion,
  sellerCounter,
  onEdit,
  onSend,
  onDismiss,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion?.text || '');

  if (!suggestion) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedText(suggestion.text);
  };

  const handleSave = () => {
    onEdit(editedText);
    setIsEditing(false);
  };

  const getConfidenceClass = () => {
    switch (suggestion.confidence) {
      case 'high': return 'mm-confidence-high';
      case 'medium': return 'mm-confidence-medium';
      case 'low': return 'mm-confidence-low';
      default: return '';
    }
  };

  const getHeaderText = () => {
    switch (suggestion.type) {
      case 'initial':
        return '💬 MarketMate Suggestion';
      case 'counter':
        return sellerCounter 
          ? `Seller Countered: $${sellerCounter}` 
          : '💬 Counter Offer';
      case 'accept':
        return '✅ Accept Offer';
      case 'walkaway':
        return '👋 Walk Away';
      default:
        return '💬 MarketMate';
    }
  };

  const getActionButtonText = () => {
    switch (suggestion.type) {
      case 'walkaway':
        return 'Send & End Negotiation';
      case 'accept':
        return 'Accept & Send';
      default:
        return 'Send';
    }
  };

  return (
    <div className="mm-overlay" data-testid="mm-overlay">
      <div className="mm-overlay-header">
        <span className="mm-overlay-title">{getHeaderText()}</span>
        <button 
          className="mm-overlay-close" 
          onClick={onDismiss}
          aria-label="Dismiss"
          data-testid="mm-overlay-close"
        >
          ×
        </button>
      </div>
      
      <div className="mm-overlay-content">
        {isEditing ? (
          <div className="mm-edit-container">
            <textarea
              className="mm-edit-textarea"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={3}
              autoFocus
              data-testid="mm-edit-textarea"
            />
            <div className="mm-edit-actions">
              <button 
                className="mm-btn mm-btn-secondary mm-btn-small"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                className="mm-btn mm-btn-primary mm-btn-small"
                onClick={handleSave}
                data-testid="mm-save-edit"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mm-suggestion-text" data-testid="mm-suggestion-text">
              "{suggestion.text}"
            </p>
            
            <div className="mm-overlay-meta">
              <span className={`mm-confidence ${getConfidenceClass()}`} data-testid="mm-confidence">
                Confidence: {suggestion.confidence.charAt(0).toUpperCase() + suggestion.confidence.slice(1)}
              </span>
              {suggestion.type === 'counter' && (
                <span className="mm-acceptance-chance" data-testid="mm-acceptance">
                  Acceptance Chance: {suggestion.confidence === 'high' ? 'Good' : suggestion.confidence === 'medium' ? 'Medium' : 'Low'}
                </span>
              )}
            </div>
          </>
        )}
      </div>
      
      {!isEditing && (
        <div className="mm-overlay-actions">
          <button 
            className="mm-btn mm-btn-secondary"
            onClick={handleEdit}
            data-testid="mm-edit-btn"
          >
            Edit
          </button>
          <button 
            className="mm-btn mm-btn-primary"
            onClick={onSend}
            data-testid="mm-send-suggestion"
          >
            {getActionButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default MessengerOverlay;
