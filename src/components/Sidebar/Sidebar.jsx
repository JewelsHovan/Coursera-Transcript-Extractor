import React from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  isKeySet, 
  onApiKeyUpdate, 
  autoNext, 
  onAutoNextToggle,
  onClose,
  onCopyToClipboard,
  onDownloadNotes,
  onExtractTranscript,
  onNextPage,
  onSummarizeNotes,
  hasNotes
}) => {
  const handleResetApiKey = () => {
    chrome.storage.local.remove('apiKey', () => {
      onApiKeyUpdate(false);
    });
  };

  return (
    <aside className="sidebar">
      <button className="close-button" onClick={onClose}>
        Close
      </button>

      <div className="api-key-status">
        <span>✓ API key is set</span>
        <button onClick={handleResetApiKey}>Reset API Key</button>
      </div>

      <button 
        className="action-button" 
        onClick={onCopyToClipboard}
        disabled={!hasNotes}
      >
        Copy to Clipboard
      </button>

      <button 
        className="action-button" 
        onClick={onDownloadNotes}
        disabled={!hasNotes}
      >
        Download Notes
      </button>

      <div className="auto-next-toggle">
        <span>Auto Next</span>
        <div 
          className={`toggle-switch ${autoNext ? 'active' : ''}`}
          onClick={() => onAutoNextToggle(!autoNext)}
        />
      </div>

      <button 
        className="action-button"
        onClick={onExtractTranscript}
        disabled={!isKeySet}
      >
        Extract Transcript
      </button>

      <button 
        className="action-button"
        onClick={onNextPage}
      >
        Next Page
      </button>

      <button 
        className="action-button"
        onClick={onSummarizeNotes}
        disabled={!hasNotes || !isKeySet}
      >
        Summarize Notes
      </button>
    </aside>
  );
};

export default Sidebar; 