// Popup script for MarketMate

document.addEventListener('DOMContentLoaded', async () => {
  const mockModeToggle = document.getElementById('mock-mode') as HTMLInputElement;
  const autoSuggestToggle = document.getElementById('auto-suggest') as HTMLInputElement;
  const statusBadge = document.getElementById('status-badge');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  // Load current settings
  const stored = await chrome.storage.local.get(['preferences', 'currentNegotiation']);
  
  if (stored.preferences) {
    mockModeToggle.checked = stored.preferences.mockMode || false;
    autoSuggestToggle.checked = stored.preferences.automationLevel !== 'suggest-only';
  }

  // Update status
  if (stored.currentNegotiation) {
    const neg = stored.currentNegotiation;
    statusBadge?.classList.remove('status-inactive');
    statusBadge?.classList.add('status-active');
    if (statusDot) statusDot.textContent = '●';
    if (statusText) statusText.textContent = `Negotiating: $${neg.currentOffer}`;
  }

  // Handle mock mode toggle
  mockModeToggle?.addEventListener('change', async () => {
    const current = await chrome.storage.local.get(['preferences']);
    const updated = { 
      ...current.preferences, 
      mockMode: mockModeToggle.checked 
    };
    await chrome.storage.local.set({ preferences: updated });
    
    // Notify content scripts
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'UPDATE_PREFERENCES', 
        payload: updated 
      });
    }
  });

  // Handle auto-suggest toggle
  autoSuggestToggle?.addEventListener('change', async () => {
    const current = await chrome.storage.local.get(['preferences']);
    const updated = { 
      ...current.preferences, 
      automationLevel: autoSuggestToggle.checked ? 'one-click-send' : 'suggest-only'
    };
    await chrome.storage.local.set({ preferences: updated });
  });
});
