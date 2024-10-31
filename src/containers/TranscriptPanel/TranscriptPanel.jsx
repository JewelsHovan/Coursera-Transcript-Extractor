import React, { useState, useEffect } from 'react';
import './TranscriptPanel.css';

function TranscriptPanel() {
  const [notes, setNotes] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [navigationData, setNavigationData] = useState(null);
  const [isKeySet, setIsKeySet] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = () => {
    chrome.storage.local.get('encryptedApiKey', ({ encryptedApiKey }) => {
      setIsKeySet(!!encryptedApiKey);
    });
  };

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    chrome.runtime.sendMessage({ 
      action: 'saveApiKey', 
      apiKey 
    }, (response) => {
      if (response.success) {
        setIsKeySet(true);
        setMessage('API key saved successfully');
        setApiKey(''); // Clear input for security
      } else {
        setMessage('Failed to save API key');
      }
    });
  };

  const handleResetApiKey = () => {
    chrome.storage.local.remove('encryptedApiKey', () => {
      setIsKeySet(false);
      setMessage('API key removed');
      setApiKey('');
    });
  };

  const handleConvertClick = () => {
    setIsLoading(true);
    console.log("Sending message to content script");
    
    // Query for Coursera tabs specifically
    chrome.tabs.query({ 
      url: "*://*.coursera.org/*",
      currentWindow: true
    }, async (tabs) => {
      if (tabs.length === 0) {
        setNotes('Error: Please open a Coursera lecture page first.');
        setIsLoading(false);
        return;
      }

      const tab = tabs[0];
      
      try {
        // First verify we can access the tab
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => true
        });
        
        // Send message to content script
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'extractTranscript' },
          (response) => {
            console.log("Response received:", response);
            
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              setNotes('Error: Please refresh the page and try again. If the problem persists, make sure you are on a Coursera lecture page.');
              setIsLoading(false);
              return;
            }
            
            if (response && response.transcript) {
              const formatted = formatTranscript(response.transcript);
              setNotes(formatted);
            } else {
              setNotes('No transcript found. Please make sure you are on a Coursera lecture page with a transcript available.');
            }
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Error:', err);
        setIsLoading(false);
        setNotes('Error: Could not access the page. Please check permissions and refresh.');
      }
    });
  };

  const handleSummarizeClick = async () => {
    console.log('1. Summarize button clicked');
    if (!isKeySet) {
      console.log('Error: API key not found');
      alert('Please enter an API key');
      return;
    }
    
    setIsLoading(true);
    setMessage(''); // Clear any previous messages
    
    try {
      console.log('2. Sending summarizeTranscript message to background');
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'summarizeTranscript', notes },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      console.log('5. Received response from background:', response);
      if (response.success) {
        setNotes(response.summary);
        setMessage('Summary generated successfully!');
      } else {
        throw new Error(response.error || 'Error summarizing transcript');
      }
    } catch (error) {
      console.error('Error summarizing transcript:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
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
    element.remove();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const fetchVideoLinks = async () => {
    chrome.tabs.query({ 
      url: "*://*.coursera.org/*",
      currentWindow: true
    }, async (tabs) => {
      if (tabs.length === 0) return;

      const tab = tabs[0];
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'getVideoLinks' },
        (response) => {
          if (response) {
            setNavigationData(response);
          }
        }
      );
    });
  };

  const handleNavigation = (direction) => {
    chrome.tabs.query({ 
      url: "*://*.coursera.org/*",
      currentWindow: true
    }, async (tabs) => {
      if (tabs.length === 0) return;

      const tab = tabs[0];
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'navigateVideo', direction }
      );
    });
  };

  const handleClose = () => {
    window.close();
  };

  useEffect(() => {
    fetchVideoLinks();
  }, []);

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>Coursera Transcript Assistant</h1>
        <div className="header-controls">
          <button onClick={toggleMinimize}>
            {isMinimized ? 'Maximize' : 'Minimize'}
          </button>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
      
      <div className="navigation-controls">
        <button 
          onClick={() => handleNavigation('previous')}
          disabled={!navigationData?.hasPrevious}
        >
          ← Previous Video
        </button>
        <button 
          onClick={() => handleNavigation('next')}
          disabled={!navigationData?.hasNext}
        >
          Next Video →
        </button>
      </div>
      
      <div className="popup-content">
        <div className="controls-section">
          <div className="api-config">
            {!isKeySet ? (
              <form onSubmit={handleApiKeySubmit}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="api-key-input"
                />
                <button type="submit">Save API Key</button>
              </form>
            ) : (
              <div className="api-key-status">
                <span>✓ API key is set</span>
                <button onClick={handleResetApiKey}>Reset API Key</button>
              </div>
            )}
            {message && <p className="api-message">{message}</p>}
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
            placeholder="Extracted transcript will appear here..."
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

export default TranscriptPanel;
