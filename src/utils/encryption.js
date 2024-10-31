const ENCRYPTION_KEY = 'coursera-assistant-key';

const encryptApiKey = (apiKey) => {
  return btoa(
    Array.from(apiKey)
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^
            ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
        )
      )
      .join('')
  );
};

const decryptApiKey = (encryptedKey) => {
  const decoded = atob(encryptedKey);
  return Array.from(decoded)
    .map((char, i) =>
      String.fromCharCode(
        char.charCodeAt(0) ^
          ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      )
    )
    .join('');
};

export { encryptApiKey, decryptApiKey };
