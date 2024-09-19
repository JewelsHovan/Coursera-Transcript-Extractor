# Project Plan: Coursera Transcript Scraper Chrome Extension

## Overview

Develop a Chrome extension using React that allows users to:

- Scrape transcripts from Coursera videos.
- Convert the transcripts into formatted notes.
- Optionally send the text to an LLM API for transformation.
- Enable users to copy or download the output.

---

## Steps

### 1. Set Up the Project Environment

- **Clone the Chrome Extension Boilerplate:**
  ```bash
  git clone https://github.com/lxieyang/chrome-extension-boilerplate-react.git your-extension-name
  ```
- **Navigate to the Project Directory:**
  ```bash
  cd your-extension-name
  ```
- **Install Dependencies:**
  ```bash
  npm install
  ```
- **Update Project Details:**
  - **`package.json`:** Change `name`, `description`, and `repository` fields.
  - **`src/manifest.json`:** Update the `name` and `description`.

### 2. Configure Manifest for Coursera Access

- **Add Permissions in `manifest.json`:**
  ```json
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "*://*.coursera.org/*"
  ],
  ```
- **Specify Content Scripts:**
  ```json
  "content_scripts": [
    {
      "matches": ["*://*.coursera.org/*"],
      "js": ["contentScript.bundle.js"]
    }
  ],
  ```

### 3. Set Up the Content Script

- **Create Content Script File:**
  - **Path:** `src/pages/ContentScript/ContentScript.js`
- **Content Script Logic:**
  - Locate the transcript element on Coursera video pages.
    - Use DOM selectors to find the transcript container.
  - Extract transcript text.
  - Listen for messages from the popup to initiate extraction.

### 4. Adjust Webpack Configuration

- **Modify `webpack.config.js`:**
  - **Add Entry Point for Content Script:**
    ```js
    entry: {
      contentScript: path.join(srcDir, 'pages', 'ContentScript', 'ContentScript.js'),
      // ...existing entries
    },
    ```
  - **Exclude Content Script from Hot Reload:**
    ```js
    chromeExtensionBoilerplate: {
      notHotReload: ['contentScript'],
    },
    ```

### 5. Develop the Popup Interface

- **Update Popup Component:**
  - **Path:** `src/pages/Popup/Popup.jsx`
- **UI Elements:**
  - A button labeled "Convert Transcript to Notes".
  - A textarea or div to display formatted notes.
  - Optional: Buttons to copy to clipboard or download notes.
- **Styling:**
  - Modify `Popup.css` to style the interface.

### 6. Implement Message Passing

- **From Popup to Content Script:**
  - **In `Popup.jsx`:**
    ```jsx
    const handleButtonClick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'extractTranscript' },
          (response) => {
            if (response && response.transcript) {
              const formatted = formatTranscript(response.transcript);
              setNotes(formatted);
            } else {
              // Handle error
            }
          }
        );
      });
    };
    ```
- **In Content Script:**

  - **In `ContentScript.js`:**

    ```js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractTranscript') {
        const transcript = getTranscriptText();
        sendResponse({ transcript });
      }
    });

    const getTranscriptText = () => {
      // Logic to extract transcript from the page
    };
    ```

### 7. Format the Transcript

- **In `Popup.jsx`:**
  ```jsx
  const formatTranscript = (text) => {
    return text
      .split('\n')
      .map((line, index) => `${index + 1}. ${line}`)
      .join('\n');
  };
  ```
- **Display Formatted Notes:**
  - Update the state to display notes in the UI.

### 8. Integrate LLM API (Future Enhancement)

- **Set Up API Calls:**
  - Use `fetch` or a library like `axios` to send a request to the LLM API.
  - Handle the API response and update the notes.
- **Security Measures:**
  - Store API keys securely.
  - Avoid hardcoding sensitive information.

### 9. Add Copy and Download Functionality

- **Copy to Clipboard:**
  - Implement a function triggered by a "Copy" button.
  - Use the Clipboard API:
    ```jsx
    const copyToClipboard = () => {
      navigator.clipboard.writeText(notes);
    };
    ```
- **Download as File:**
  - Create a function to download notes as a `.txt` or `.md` file.
    ```jsx
    const downloadNotes = () => {
      const element = document.createElement('a');
      const file = new Blob([notes], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'notes.txt';
      document.body.appendChild(element);
      element.click();
    };
    ```

### 10. Test the Extension

- **Run Development Server:**
  ```bash
  npm start
  ```
- **Load Unpacked Extension in Chrome:**
  - Navigate to `chrome://extensions/`.
  - Enable Developer Mode.
  - Click "Load unpacked" and select the `build` folder.
- **Verify Functionality:**
  - Open a Coursera video with a transcript.
  - Click the extension icon and use the popup.
  - Ensure the transcript is extracted and formatted correctly.

### 11. Build for Production

- **Create a Production Build:**
  ```bash
  npm run build
  ```
- **Test the Production Version:**
  - Reload the extension with the production build.
  - Perform final tests to confirm stability.

---

## Additional Notes

- **Error Handling:**
  - Implement user-friendly messages for scenarios where:
    - The transcript is not available.
    - Errors occur during extraction or formatting.
- **Code Maintenance:**
  - Keep code modular and well-documented.
  - Follow best practices for React and Chrome extensions.
- **Future Enhancements:**
  - Allow users to customize formatting options.
  - Support for other educational platforms.
  - Integration with note-taking apps or services.

---

## Resources

- **Chrome Extension Development:**
  - [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/mv3/)
- **React and Webpack:**
  - [React Documentation](https://reactjs.org/docs/getting-started.html)
  - [Webpack Documentation](https://webpack.js.org/concepts/)
- **Boilerplate Repository:**
  - [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

---

## Next Steps

- We could potentially include a functinoality to upload the transcripts to a vector database for seraching and retrieval (RAG)
- We could potentially include a functionlity to generate a PDF report with the extracted transcripts and summaries
- We could potentially include a functionlity to send the extracted transcripts and summaries to a LLM for further analysis

---

## Resources

- **OpenAI API Documentation:**
  - [Chat Completions](https://platform.openai.com/docs/guides/chat/introduction)
  - [API Reference](https://platform.openai.com/docs/api-reference)
- **Claude API Documentation:**
  - [API Reference](https://www.anthropic.com/docs/api-reference)

---

**Happy Coding!**
