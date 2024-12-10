import React, { useState, useEffect } from 'react';
import TranscriptPanel from '../../containers/TranscriptPanel/TranscriptPanel';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Popup.css';

const Popup = () => {
  const [isKeySet, setIsKeySet] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [currentTab, setCurrentTab] = useState('transcript');
  const [notes, setNotes] = useState('');

  // Check for API key on component mount
  useEffect(() => {
    chrome.storage.local.get('apiKey', (result) => {
      setIsKeySet(!!result.apiKey);
    });
  }, []);

  const handleApiKeyUpdate = (newKeySet) => {
    setIsKeySet(newKeySet);
  };

  const handleAutoNextToggle = (value) => {
    setAutoNext(value);
  };

  const handleNotesUpdate = (newNotes) => {
    setNotes(newNotes);
  };

  const handleClose = () => {
    window.close(); // Closes the popup
  };

  const handleExtractTranscript = async () => {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script to extract transcript
    chrome.tabs.sendMessage(tab.id, { action: 'extractTranscript' }, (response) => {
      if (response && response.transcript) {
        setNotes(response.transcript);
      }
    });
  };

  const handleNextPage = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'nextPage' });
  };

  const handleSummarizeNotes = async () => {
    if (!notes) return;

    const apiKey = await chrome.storage.local.get('apiKey');
    if (!apiKey) {
      alert('Please set your API key first');
      return;
    }

    // Implementation for summarizing notes using OpenAI API
    // This is a placeholder - you'll need to implement the actual API call
    try {
      // Call your API here
      const summary = 'Summary will go here...';
      setNotes(summary);
      setCurrentTab('summary');
    } catch (error) {
      console.error('Error summarizing notes:', error);
    }
  };

  const handleCopyToClipboard = () => {
    if (notes) {
      navigator.clipboard.writeText(notes)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  const handleDownloadNotes = () => {
    if (notes) {
      const blob = new Blob([notes], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript-notes.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        <Sidebar 
          isKeySet={isKeySet}
          onApiKeyUpdate={handleApiKeyUpdate}
          autoNext={autoNext}
          onAutoNextToggle={handleAutoNextToggle}
          hasNotes={!!notes}
          onClose={handleClose}
          onCopyToClipboard={handleCopyToClipboard}
          onDownloadNotes={handleDownloadNotes}
          onExtractTranscript={handleExtractTranscript}
          onNextPage={handleNextPage}
          onSummarizeNotes={handleSummarizeNotes}
        />
        <main className="main-content">
          <TranscriptPanel 
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            notes={notes}
            onNotesUpdate={handleNotesUpdate}
            isKeySet={isKeySet}
            autoNext={autoNext}
          />
        </main>
      </div>
    </div>
  );
};

export default Popup;
