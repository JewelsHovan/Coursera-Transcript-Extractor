// Add this at the top of your content script
let isConnected = false;

// Notify that content script is loaded with retry logic
function notifyContentScriptReady() {
  chrome.runtime.sendMessage({ action: 'contentScriptReady' }, (response) => {
    if (chrome.runtime.lastError) {
      // If connection failed, retry after a short delay
      setTimeout(notifyContentScriptReady, 1000);
      return;
    }
    isConnected = true;
  });
}

// Initialize connection
notifyContentScriptReady();

// Function to extract transcript text
function getTranscriptText() {
  const phraseElements = document.querySelectorAll('.rc-Phrase.css-13o25cb');
  if (phraseElements.length === 0) {
    return 'No transcript found.';
  }

  const textArray = Array.from(phraseElements).map((element) =>
    element.textContent.trim()
  );
  return textArray.join(' ');
}

// Cache storage with chrome.storage.local
function updateNavigationCache(navigationData) {
  const currentUrl = window.location.href;
  chrome.storage.local.set({
    navigationCache: {
      url: currentUrl,
      data: navigationData,
      timestamp: Date.now(),
    },
  });
  return navigationData;
}

// Modified getVideoLinks function with persistent storage
async function getVideoLinks() {
  const currentUrl = window.location.href;

  // Try to get cached data first
  const cache = await chrome.storage.local.get('navigationCache');
  const navigationCache = cache.navigationCache;

  // Return cached data if URL hasn't changed and cache isn't too old (1 hour)
  if (
    navigationCache &&
    navigationCache.url === currentUrl &&
    navigationCache.data &&
    Date.now() - navigationCache.timestamp < 3600000
  ) {
    return navigationCache.data;
  }

  const sidebar = document.querySelector('.rc-LessonItems');
  if (!sidebar) return null;

  const links = Array.from(sidebar.querySelectorAll('a')).map((link) => ({
    title: link.querySelector('.rc-NavItemName')?.innerText.trim(),
    url: link.href,
    isCurrent: link.href === currentUrl,
  }));

  const currentIndex = links.findIndex((link) => link.isCurrent);

  const navigationData = {
    links,
    currentIndex,
    hasNext: currentIndex < links.length - 1,
    hasPrevious: currentIndex > 0,
  };

  // Update persistent cache
  return updateNavigationCache(navigationData);
}

// Add URL change detection
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    navigationCache = { url: null, data: null }; // Clear cache on URL change
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!isConnected) {
    sendResponse({ error: 'Content script not ready' });
    return true;
  }

  try {
    if (request.action === 'extractTranscript') {
      const transcript = getTranscriptText();
      sendResponse({ transcript });
    } else if (request.action === 'getVideoLinks') {
      // Handle async getVideoLinks
      getVideoLinks().then((navigationData) => {
        sendResponse(navigationData);
      });
      return true;
    } else if (request.action === 'navigateVideo') {
      getVideoLinks().then((navigationData) => {
        if (!navigationData) {
          sendResponse({ error: 'Navigation data not available' });
          return;
        }

        const { direction } = request;
        const { links, currentIndex } = navigationData;

        if (direction === 'next' && currentIndex < links.length - 1) {
          window.location.href = links[currentIndex + 1].url;
        } else if (direction === 'previous' && currentIndex > 0) {
          window.location.href = links[currentIndex - 1].url;
        }
        sendResponse({ success: true });
      });
      return true;
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
  return true;
});

console.log('Coursera Transcript Assistant: Content script loaded');
