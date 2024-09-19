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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'extractTranscript') {
    const transcript = getTranscriptText();
    console.log('Extracted transcript:', transcript);
    sendResponse({ transcript });
  }
  return true; // Indicates that the response will be sent asynchronously
});
