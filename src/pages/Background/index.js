import { encryptApiKey, decryptApiKey } from '../../utils/encryption';

let contentScriptReady = false;
let panelWindow = null;

// Retrieve API key on extension load
chrome.storage.local.get('encryptedApiKey', ({ encryptedApiKey }) => {
  if (encryptedApiKey) {
    const apiKey = decryptApiKey(encryptedApiKey);
    // Use apiKey here, or store it in a variable for later use
  }
});

// Track content script status with timeout
function waitForContentScript(tabId, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Content script connection timeout'));
    }, timeout);

    chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Modify your message handlers to check connection first
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'contentScriptReady') {
    contentScriptReady = true;
    sendResponse({ status: 'acknowledged' });
    return true;
  }

  if (request.action === 'saveApiKey') {
    const encryptedKey = encryptApiKey(request.apiKey);
    chrome.storage.local.set({ encryptedApiKey: encryptedKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'summarizeTranscript') {
    console.log('3. Background received summarizeTranscript request');
    const { notes } = request;

    // Create a promise to handle the API call
    const handleSummarization = async () => {
      try {
        const { encryptedApiKey } = await chrome.storage.local.get(
          'encryptedApiKey'
        );
        console.log('4. Retrieved encrypted API key:', !!encryptedApiKey);

        if (!encryptedApiKey) {
          return { success: false, error: 'API key not set' };
        }

        const apiKey = decryptApiKey(encryptedApiKey);
        console.log('Making OpenAI API request...');

        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a helpful assistant that summarizes lecture transcripts into detailed notes.',
                },
                {
                  role: 'user',
                  content: `Summarize the following lecture transcript into detailed notes:\n\n${notes}`,
                },
              ],
              temperature: 0.6,
              max_tokens: 4096,
            }),
          }
        );

        const data = await response.json();
        console.log('OpenAI API response received:', data);

        if (data.choices && data.choices[0] && data.choices[0].message) {
          return {
            success: true,
            summary: data.choices[0].message.content,
          };
        } else {
          return {
            success: false,
            error: 'Unexpected response format',
          };
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        return { success: false, error: error.message };
      }
    };

    // Execute the promise and send response
    handleSummarization().then((response) => {
      sendResponse(response);
    });

    return true; // Keep message channel open
  }
});

// Open panel when clicking extension icon
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('coursera.org')) {
    // If panel is already open, focus it
    if (panelWindow) {
      chrome.windows.update(panelWindow.id, { focused: true });
      return;
    }

    // Create new panel window
    chrome.windows.create(
      {
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 800,
        height: 600,
        focused: true,
      },
      (window) => {
        panelWindow = window;
      }
    );
  }
});

// Track panel window closure
chrome.windows.onRemoved.addListener((windowId) => {
  if (panelWindow && panelWindow.id === windowId) {
    panelWindow = null;
  }
});
