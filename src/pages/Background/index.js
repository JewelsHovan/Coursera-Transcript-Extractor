chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create(
    {
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400,
      height: 600,
    },
    (window) => {
      chrome.sidePanel.setPanelBehavior({
        windowId: window.id,
        type: 'panel',
        openAtStart: true,
      });
    }
  );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarizeTranscript') {
    const { apiKey, notes } = request;

    fetch('https://api.openai.com/v1/chat/completions', {
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
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
          sendResponse({
            success: true,
            summary: data.choices[0].message.content,
          });
        } else {
          sendResponse({ success: false, error: 'Unexpected response format' });
        }
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Indicates that the response will be sent asynchronously
  }
});
