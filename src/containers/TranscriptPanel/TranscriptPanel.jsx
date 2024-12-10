import React from 'react';
import ReactMarkdown from 'react-markdown';
import './TranscriptPanel.css';

const TranscriptPanel = ({ 
  currentTab, 
  onTabChange, 
  notes, 
  isKeySet 
}) => {
  return (
    <div className="transcript-panel">
      <div className="tabs">
        <button 
          className={`tab ${currentTab === 'transcript' ? 'active' : ''}`}
          onClick={() => onTabChange('transcript')}
        >
          TAB 1
        </button>
        <button 
          className={`tab ${currentTab === 'summary' ? 'active' : ''}`}
          onClick={() => onTabChange('summary')}
        >
          TAB 2
        </button>
      </div>
      
      <div className="content">
        {notes ? (
          <ReactMarkdown className="markdown-content">
            {notes}
          </ReactMarkdown>
        ) : (
          <div className="empty-state">
            No content yet. Click "Extract Transcript" to begin.
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;
