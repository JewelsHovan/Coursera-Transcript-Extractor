import React, { useState, useEffect } from 'react';

const ApiKeySetup = () => {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = () => {
    chrome.storage.local.get('encryptedApiKey', ({ encryptedApiKey }) => {
      setIsKeySet(!!encryptedApiKey);
    });
  };

  const handleSubmit = (e) => {
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

  const handleReset = () => {
    chrome.storage.local.remove('encryptedApiKey', () => {
      setIsKeySet(false);
      setMessage('API key removed');
      setApiKey('');
    });
  };

  return (
    <div className="api-key-setup">
      {!isKeySet ? (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="api-key-input"
          />
          <button type="submit" className="save-key-btn">Save API Key</button>
        </form>
      ) : (
        <div className="api-key-status">
          <span>✓ API key is set</span>
          <button onClick={handleReset} className="reset-key-btn">Reset API Key</button>
        </div>
      )}
      {message && <p className="api-message">{message}</p>}
    </div>
  );
};

export default ApiKeySetup; 