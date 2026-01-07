// Test server for E2E tests - serves mock Facebook Marketplace and Messenger pages

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PORT = 3000;

const mockMarketplacePage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mock Facebook Marketplace</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: #f0f2f5; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .listing { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .listing-image { width: 100%; height: 300px; background: #ddd; border-radius: 8px; margin-bottom: 16px; }
    .listing-price { font-size: 24px; font-weight: bold; color: #1877f2; }
    .listing-title { font-size: 20px; margin: 8px 0; }
    .listing-details { color: #65676b; font-size: 14px; }
    .listing-description { margin-top: 16px; line-height: 1.5; }
    .seller-info { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    .seller-avatar { width: 48px; height: 48px; border-radius: 50%; background: #1877f2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="listing">
      <div class="listing-image" data-testid="marketplace_listing_image"></div>
      <div class="listing-price" data-testid="marketplace_listing_price">$250</div>
      <h1 class="listing-title" data-testid="marketplace_listing_title">Sony PlayStation 5 Console - Like New</h1>
      <div class="listing-details">
        <span data-testid="marketplace_listing_location">Listed in San Francisco, CA</span>
        <span> • </span>
        <span data-testid="marketplace_listing_time">Listed 18 days ago</span>
        <span> • </span>
        <span data-testid="marketplace_listing_condition">Condition: Good</span>
        <span> • </span>
        <span data-testid="marketplace_listing_category">Category: Electronics</span>
      </div>
      <div class="listing-description" data-testid="marketplace_listing_description">
        Selling my PS5 in great condition. Includes one controller and all original cables.
        Must sell - moving next week! Price is negotiable for serious buyers.
        No lowballers please.
      </div>
      <div class="seller-info">
        <div class="seller-avatar"></div>
        <div>
          <a href="/marketplace/profile/123456" data-testid="marketplace_seller_name">John D.</a>
          <div style="color: #65676b; font-size: 12px;">Usually responds within 1 hour</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Extension will inject here -->
  <script>
    // Simulate Facebook's URL structure
    window.history.replaceState({}, '', '/marketplace/item/123456789');
  </script>
</body>
</html>
`;

const mockMessengerPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mock Messenger</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: #f0f2f5; }
    .messenger-container { display: flex; height: 100vh; }
    .sidebar { width: 300px; background: white; border-right: 1px solid #ddd; }
    .chat-area { flex: 1; display: flex; flex-direction: column; }
    .chat-header { padding: 16px; background: white; border-bottom: 1px solid #ddd; }
    .messages { flex: 1; padding: 16px; overflow-y: auto; }
    .message { margin-bottom: 12px; }
    .message-text { display: inline-block; padding: 8px 12px; border-radius: 18px; background: #e4e6eb; max-width: 70%; }
    .message.sent .message-text { background: #0084ff; color: white; }
    .input-area { padding: 16px; background: white; border-top: 1px solid #ddd; position: relative; }
    .input-box { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px; }
    .input-box:focus { border-color: #0084ff; }
  </style>
</head>
<body>
  <div class="messenger-container">
    <div class="sidebar">
      <div style="padding: 16px; font-weight: bold;">Chats</div>
    </div>
    <div class="chat-area" role="main">
      <div class="chat-header">
        <strong>John D.</strong>
        <div style="color: #65676b; font-size: 12px;">About: Sony PlayStation 5 Console</div>
      </div>
      <div class="messages">
        <div class="message">
          <div class="message-text">Hi! Is this still available?</div>
        </div>
        <div class="message sent">
          <div class="message-text">Yes, it is! Are you interested?</div>
        </div>
      </div>
      <div class="input-area">
        <!-- MarketMate overlay will appear above this -->
        <div 
          data-testid="messenger-input-box" 
          role="textbox" 
          contenteditable="true" 
          class="input-box"
          aria-label="Message"
        ></div>
      </div>
    </div>
  </div>
  
  <script>
    // Handle input
    const input = document.querySelector('[data-testid="messenger-input-box"]');
    input.addEventListener('input', () => {
      console.log('Input changed:', input.textContent);
    });
    
    // Listen for storage changes (for test simulation)
    window.addEventListener('storage', () => {
      window.location.reload();
    });
  </script>
</body>
</html>
`;

const server = createServer((req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  switch (url.pathname) {
    case '/':
    case '/mock-marketplace':
    case '/marketplace/item/123456789':
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(mockMarketplacePage);
      break;
      
    case '/mock-messenger':
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(mockMessengerPage);
      break;
      
    default:
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  /mock-marketplace - Mock Facebook Marketplace listing');
  console.log('  /mock-messenger   - Mock Messenger conversation');
});
