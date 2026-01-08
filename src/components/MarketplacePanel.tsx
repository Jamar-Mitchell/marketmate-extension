import React, { useState, useCallback, useRef, useEffect } from "react";
import type {
  PriceAnalysis,
  UserPreferences,
  NegotiationStyle,
  PriceFactor,
} from "../types";

const MarketMateLogo: React.FC<{ size?: number; inline?: boolean }> = ({
  size = 20,
  inline = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 62 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={
      inline ? { marginLeft: 6, verticalAlign: "middle" } : { display: "block" }
    }
  >
    <path
      d="M52.5 55H10.4142C10.149 55 9.89464 54.8946 9.70711 54.7071L8.33332 53.3333C8.12225 53.1222 8.0165 52.8279 8.045 52.5308L11.4133 17.4045C11.4625 16.8916 11.8934 16.5 12.4087 16.5H49.1157C49.6207 16.5 50.0464 16.8765 50.1082 17.3776L54.4507 52.6C54.4823 52.8567 54.4133 53.1155 54.2582 53.3224L53.3 54.6C53.1111 54.8518 52.8148 55 52.5 55Z"
      fill="#FFF0CD"
    />
    <path
      d="M16 35C16 35 16 32 18.5 32C21 32 21 35 21 35M8.045 52.5308L11.4133 17.4045C11.4625 16.8916 11.8934 16.5 12.4087 16.5H49.1157C49.6207 16.5 50.0464 16.8765 50.1082 17.3776L54.4507 52.6C54.4823 52.8567 54.4133 53.1155 54.2582 53.3224L53.3 54.6C53.1111 54.8518 52.8148 55 52.5 55H10.4142C10.149 55 9.89464 54.8946 9.70711 54.7071L8.33332 53.3333C8.12225 53.1222 8.0165 52.8279 8.045 52.5308Z"
      stroke="#3D546C"
      strokeWidth="2.5"
    />
    <path
      d="M16 35C16 35 16 32 18.5 32C21 32 21 35 21 35M47.5 49.5L45.5305 17.0034C45.5134 16.7206 45.279 16.5 44.9957 16.5C44.7159 16.5 44.4832 16.7153 44.4615 16.9942L41.697 52.4712C41.6265 53.376 42.7008 53.8993 43.3698 53.2861L47.5 49.5ZM47.5 49.5L54 54M19 19.5C19 19.5 16 5 26.5 5C37 5 35.5 19.5 35.5 19.5M8.045 52.5308L11.4133 17.4045C11.4625 16.8916 11.8934 16.5 12.4087 16.5H49.1157C49.6207 16.5 50.0464 16.8765 50.1082 17.3776L54.4507 52.6C54.4823 52.8567 54.4133 53.1155 54.2582 53.3224L53.3 54.6C53.1111 54.8518 52.8148 55 52.5 55H10.4142C10.149 55 9.89464 54.8946 9.70711 54.7071L8.33332 53.3333C8.12225 53.1222 8.0165 52.8279 8.045 52.5308Z"
      stroke="#255992"
      strokeWidth="2.5"
    />
    <path
      d="M44.5 16.5H44.5588C45.0876 16.5 45.5249 16.9117 45.5569 17.4395L47.4706 49.0149C47.4892 49.3212 47.6473 49.602 47.8996 49.7766L54 54M19 19.5C19 19.5 16 5 26.5 5C37 5 35.5 19.5 35.5 19.5"
      stroke="#255992"
      strokeWidth="2.5"
    />
    <path
      d="M44.5 25.5L43 52L44 51.5L47 48L44.5 25.5Z"
      fill="#CDC1A6"
      stroke="#CDC1A6"
      strokeWidth="2"
    />
    <path
      d="M47.75 18L44 55L46.5 54.3019L54 49.4151L47.75 18Z"
      fill="#CDC1A6"
      stroke="#CDC1A6"
      strokeWidth="2"
    />
    <path
      d="M27 35C27 35 27 32 29.5 32C32 32 32 35 32 35"
      stroke="#255992"
      strokeWidth="2.5"
    />
    <path
      d="M23 16C23 16 23 4 31.5 4C40 4 40 16 40 16"
      stroke="#255992"
      strokeWidth="2.5"
    />
    <path
      d="M29 38C29 38 29 42 24 42C19 42 19 38 19 38"
      stroke="#255992"
      strokeWidth="2.5"
    />
    <path d="M9 53L52 53" stroke="#CDC1A6" strokeWidth="3" />
    <path d="M47 53V51L54 52.6" stroke="#CDC1A6" strokeWidth="2" />
    <path
      d="M16 35C16 35 16 32 18.5 32C21 32 21 35 21 35M47.5 49.5L45.5305 17.0034C45.5134 16.7206 45.279 16.5 44.9957 16.5M47.5 49.5L43.3698 53.2861C42.7008 53.8993 41.6265 53.376 41.697 52.4712M47.5 49.5L54 54M47.5 49.5L45.5305 17.0034C45.5134 16.7206 45.279 16.5 44.9957 16.5M47.5 49.5L43.3698 53.2861C42.7008 53.8993 41.6265 53.376 41.697 52.4712M19 19.5C19 19.5 16 5 26.5 5C37 5 35.5 19.5 35.5 19.5M44.9957 16.5C44.7159 16.5 44.4832 16.7153 44.4615 16.9942L41.697 52.4712M44.9957 16.5C44.7159 16.5 44.4832 16.7153 44.4615 16.9942L41.697 52.4712M8.045 52.5308L11.4133 17.4045M8.045 52.5308L11.4133 17.4045M8.045 52.5308C8.0165 52.8279 8.12225 53.1222 8.33332 53.3333L9.70711 54.7071M8.045 52.5308C8.0165 52.8279 8.12225 53.1222 8.33332 53.3333L9.70711 54.7071M12.4087 16.5H49.1157C49.6207 16.5 50.0464 16.8765 50.1082 17.3776L54.4507 52.6C54.4823 52.8567 54.4133 53.1155 54.2582 53.3224L53.3 54.6C53.1111 54.8518 52.8148 55 52.5 55M12.4087 16.5H49.1157C49.6207 16.5 50.0464 16.8765 50.1082 17.3776L54.4507 52.6C54.4823 52.8566 54.4133 53.1155 54.2582 53.3224L53.3 54.6C53.1111 54.8518 52.8148 55 52.5 55M12.4087 16.5C11.8934 16.5 11.4625 16.8916 11.4133 17.4045M12.4087 16.5C11.8934 16.5 11.4625 16.8916 11.4133 17.4045M52.5 55H10.4142M52.5 55H10.4142M10.4142 55C10.149 55 9.89464 54.8946 9.70711 54.7071M10.4142 55C10.149 55 9.89464 54.8946 9.70711 54.7071"
      stroke="#255992"
      strokeWidth="2.5"
    />
    <path
      d="M40.1135 36.8874C49.5425 30.4437 44.6588 24.2528 40.0417 28.2808C35.6058 24.9856 31.3281 30.71 40.1135 36.8874Z"
      fill="#F48181"
    />
    <path
      d="M40 36.9645C49.6102 30.4739 44.6477 24.1993 40 28.3174M40.4999 37.1537C30.8898 30.6631 35.8523 24.5356 40.5 28.6537"
      stroke="#F48181"
    />
    <path
      d="M51.1135 48.8874C60.5425 42.4437 55.6588 36.2528 51.0417 40.2808C46.6058 36.9856 42.3281 42.71 51.1135 48.8874Z"
      fill="#F48181"
    />
    <path
      d="M51 48.9645C60.6102 42.4739 55.6477 36.1993 51 40.3174M51.4999 49.1537C41.8898 42.6631 46.8523 36.5356 51.5 40.6537"
      stroke="#F48181"
    />
  </svg>
);

interface MarketplacePanelProps {
  askingPrice: number;
  analysis: PriceAnalysis | null;
  preferences: UserPreferences;
  expanded: boolean;
  isMessengerOpen: boolean;
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
  isMessengerOpen,
  onToggle,
  onMaxPriceChange,
  onStyleChange,
  onSuggestMessage,
  onSendOffer,
  onClose,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [snapSide, setSnapSide] = useState<"left" | "right">("right");
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingExpanded, setIsDraggingExpanded] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    },
    [position]
  );

  const handleExpandedMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingExpanded(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: 0,
      initialY: 0,
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      if (isDragging) {
        const deltaX = dragRef.current.startX - e.clientX;
        const deltaY = dragRef.current.startY - e.clientY;
        setPosition({
          x: Math.max(0, dragRef.current.initialX + deltaX),
          y: Math.max(0, dragRef.current.initialY + deltaY),
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingExpanded) {
        // Snap to left or right based on mouse position
        const screenMidpoint = window.innerWidth / 2;
        setSnapSide(e.clientX < screenMidpoint ? "left" : "right");
      }
      setIsDragging(false);
      setIsDraggingExpanded(false);
      dragRef.current = null;
    };

    if (isDragging || isDraggingExpanded) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isDraggingExpanded]);

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
        className="mm-panel mm-panel-mini"
        data-testid="mm-panel-collapsed"
        style={{
          right: position.x,
          bottom: position.y,
        }}
      >
        <div
          className="mm-drag-handle"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          title="Drag to move"
        >
          <span className="mm-drag-dots">⋮⋮</span>
        </div>
        <div
          className="mm-mini-logo"
          onClick={() => {
            if (!isDragging && dragRef.current === null) {
              onToggle();
            }
          }}
          title="Click to expand MarketMate"
        >
          <MarketMateLogo size={44} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mm-panel mm-panel-expanded mm-snap-${snapSide}`}
      data-testid="mm-panel-expanded"
      style={{ cursor: isDraggingExpanded ? "grabbing" : undefined }}
    >
      <div className="mm-header">
        <div
          className="mm-expanded-drag-handle"
          onMouseDown={handleExpandedMouseDown}
          style={{ cursor: isDraggingExpanded ? "grabbing" : "grab" }}
          title="Drag to snap left or right"
        >
          <span className="mm-drag-dots">⋮⋮</span>
        </div>
        <span
          className="mm-logo"
          onClick={onToggle}
          style={{ cursor: "pointer" }}
        >
          MarketMate
          <MarketMateLogo size={28} inline />
        </span>
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
              <span className="mm-recommended">
                ${analysis.recommendedOffer}
              </span>
            </div>

            <div className="mm-row">
              <span className="mm-label">Seller Flexibility</span>
              {renderFlexibilityDots(analysis.flexibility)}
            </div>

            <details className="mm-factors">
              <summary>Price Factors</summary>
              <ul className="mm-factors-list">
                {analysis.factors.map((factor: PriceFactor, index: number) => (
                  <li
                    key={index}
                    className={`mm-factor mm-factor-${factor.impact}`}
                  >
                    <span>
                      {factor.impact === "positive"
                        ? "✓"
                        : factor.impact === "negative"
                        ? "✗"
                        : "•"}
                    </span>
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
            {(["polite", "neutral", "firm"] as NegotiationStyle[]).map(
              (style) => (
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
              )
            )}
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
            {isMessengerOpen ? "Message Chat" : "Open Messenger"}
          </button>
        </div>
      </div>
    </div>
  );
};
