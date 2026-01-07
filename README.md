# MarketMate - Browser Extension

> Automate price negotiation on Facebook Marketplace

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Platform](https://img.shields.io/badge/platform-Chrome-green)
![MV3](https://img.shields.io/badge/manifest-v3-orange)

## Features

- 📊 **Listing Intelligence** - Extract and analyze marketplace listings
- 💰 **Fair Price Estimation** - Calculate fair value ranges based on multiple factors
- 💬 **Smart Negotiation** - Generate contextual negotiation messages
- 🎯 **Flexibility Detection** - Identify motivated sellers
- 📱 **Messenger Integration** - Inline overlay for conversation assistance

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser

### Installation

```bash
# Clone the repository
git clone https://github.com/Jamar-Mitchell/marketmate-extension.git
cd marketmate-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist` folder from this project

### Development

```bash
# Start development build with watch mode
npm run build:watch

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Project Structure

```
marketmate-extension/
├── public/
│   └── manifest.json          # Extension manifest (MV3)
├── src/
│   ├── background/            # Service worker
│   ├── content/               # Marketplace content script
│   ├── messenger/             # Messenger overlay script
│   ├── components/            # React UI components
│   ├── engine/                # Pricing & negotiation logic
│   ├── store/                 # Zustand state management
│   ├── styles/                # CSS styles
│   └── types/                 # TypeScript definitions
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   ├── unit/                  # Vitest unit tests
│   └── server/                # Mock server for testing
└── dist/                      # Built extension (generated)
```

## How It Works

### 1. Listing Analysis

When you visit a Facebook Marketplace listing, MarketMate:

- Extracts price, title, description, and seller info from the DOM
- Analyzes listing age, condition keywords, and urgency indicators
- Calculates a fair value range based on multiple pricing factors

### 2. Price Estimation Factors

- **Time on Market** - Older listings = more negotiation room
- **Condition** - Keywords affect value estimation
- **Urgency Indicators** - "Must sell", "Moving", etc.
- **Category Depreciation** - Electronics depreciate faster than furniture
- **Price Psychology** - Round prices often have more wiggle room

### 3. Negotiation Assistance

- Choose your style: Polite / Neutral / Firm
- Set your maximum price
- Get AI-suggested messages
- Track negotiation state

### 4. Safety Features

- User-triggered sends only (no auto-messaging)
- Clear visual indicators
- State tracking to prevent over-messaging

## Configuration

### User Preferences

| Option     | Description               | Default        |
| ---------- | ------------------------- | -------------- |
| Max Spend  | Your maximum budget       | Fair value max |
| Style      | Negotiation tone          | Polite         |
| Automation | Suggest-only or one-click | Suggest-only   |
| Mock Mode  | Use test data             | Off            |

## Testing

### Unit Tests (Vitest)

```bash
npm test
```

Tests cover:

- Pricing engine calculations
- Negotiation state machine
- Message generation

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Tests cover:

- Panel expand/collapse
- Price analysis display
- Style selection
- Message generation
- Full negotiation flows

## API Reference

### Pricing Engine

```typescript
import { analyzePricing } from "./engine/pricingEngine";

const analysis = analyzePricing(listingData);
// Returns: { fairValueMin, fairValueMax, recommendedOffer, flexibility, factors }
```

### Negotiation Engine

```typescript
import { createSession, generateMessage } from "./engine/negotiationEngine";

const session = createSession(listingId, initialOffer, maxPrice);
const suggestion = generateMessage("initial", "polite", 180);
```

## Roadmap

- [x] Core pricing heuristics
- [x] Marketplace panel UI
- [x] Messenger overlay
- [x] State management
- [x] E2E test suite
- [ ] External price comparisons
- [ ] ML-based price prediction
- [ ] Multi-language support
- [ ] Firefox support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Disclaimer

This extension is for educational purposes. Use responsibly and respect Facebook's Terms of Service. The developers are not responsible for any account actions taken by Facebook.
