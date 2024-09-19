import React, { useState, useRef, useEffect } from 'react';
import './Greetings.css';

function Greetings() {
  const [notes, setNotes] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const popupRef = useRef(null);

  const handleConvertClick = () => {
    console.log("Sending message to content script");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'extractTranscript' },
        (response) => {
          console.log("Response received:", response);
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          }
          if (response && response.transcript) {
            const formatted = formatTranscript(response.transcript);
            setNotes(formatted);
          } else {
            setNotes('Transcript not found.');
          }
        }
      );
    });
  };

  const handleSummarizeClick = async () => {
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }
    setIsLoading(true);
    try {
      chrome.runtime.sendMessage(
        { action: 'summarizeTranscript', apiKey, notes },
        (response) => {
          if (response.success) {
            setNotes(response.summary);
          } else {
            throw new Error(response.error || 'Error summarizing transcript');
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error summarizing transcript:', error);
      alert('Error summarizing transcript. Please check your API key and try again.');
      setIsLoading(false);
    }
  };

  const formatTranscript = (text) => {
    return text
      .split('\n')
      .map((line, index) => `${index + 1}. ${line}`)
      .join('\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notes);
  };

  const downloadNotes = () => {
    const element = document.createElement('a');
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'notes.txt';
    document.body.appendChild(element);
    element.click();
  };

  const toggleAlwaysOnTop = () => {
    setIsAlwaysOnTop(!isAlwaysOnTop);
    if (!isAlwaysOnTop) {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    } else {
      chrome.sidePanel.close({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`popup-container ${isMinimized ? 'minimized' : ''}`} ref={popupRef}>
      <div className="popup-header">
        <h1>Coursera Transcript Assistant</h1>
        <div className="popup-controls">
          <button onClick={toggleAlwaysOnTop}>{isAlwaysOnTop ? 'Disable' : 'Enable'} Always on Top</button>
          <button onClick={toggleMinimize}>{isMinimized ? 'Maximize' : 'Minimize'}</button>
          <button onClick={() => window.close()}>Close</button>
        </div>
      </div>
      
      <div className="popup-content">
        <div className="controls-section">
          <div className="api-config">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter OpenAI API Key"
            />
          </div>
          <div className="action-buttons">
            <button onClick={handleConvertClick} disabled={isLoading}>Extract Transcript</button>
            <button onClick={handleSummarizeClick} disabled={isLoading || !notes}>Summarize Notes</button>
          </div>
        </div>
        
        <div className="output-section">
          <textarea 
            value={notes} 
            readOnly 
            placeholder="Extracted transcript and summarized notes will appear here..."
          />
          <div className="word-count">Word count: {notes.split(/\s+/).filter(Boolean).length}</div>
        </div>
      </div>
      
      <div className="popup-footer">
        <button onClick={copyToClipboard} disabled={!notes}>Copy to Clipboard</button>
        <button onClick={downloadNotes} disabled={!notes}>Download Notes</button>
      </div>
      
      {isLoading && <div className="loading-overlay">Processing...</div>}
    </div>
  );
}

export default Greetings;
