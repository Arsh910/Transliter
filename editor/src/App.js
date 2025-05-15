import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [text, setText] = useState('');
  const [model, setModel] = useState(1);
  const [modelMessage, setModelMessage] = useState('');
  const [lastWordSent, setLastWordSent] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleModelChange = (e) => {
    const selectedModel = Number(e.target.value);
    setModel(selectedModel);
    setModelMessage(`✅ Model ${selectedModel === 1 ? 'A' : 'B'} activated`);
    setTimeout(() => setModelMessage(''), 2000);
  };

  const handleTextChange = (e) => {
    const input = e.target.value;
    setText(input);

    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      sendLastWord(input);
    }, 700)); // wait 700ms after typing stops
  };

  const sendLastWord = async (input) => {
    const words = input.trim().split(/\s+/);
    const lastWord = words[words.length - 1];

    if (!lastWord || lastWord === lastWordSent) return;

    try {
      const response = await axios.post('https://transliter.onrender.com/transliterate', {
        text: lastWord,
        model_id: model
      });

      const newWords = [...words];
      newWords[words.length - 1] = response.data.output;
      setText(newWords.join(' ') + ' ');
      setLastWordSent(response.data.output);
    } catch (error) {
      console.error("Transliteration failed:", error);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <h2 style={{ color: '#00ffcc' }}>📝 Transliteration Editor</h2>

      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Choose Model:</label>
        <select
          value={model}
          onChange={handleModelChange}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            backgroundColor: '#2b2f36',
            color: '#ffffff',
            border: '1px solid #555',
            borderRadius: '5px'
          }}
        >
          <option value={1}>Model A</option>
          <option value={2}>Model B</option>
        </select>

        {modelMessage && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#28a745',
            color: '#fff',
            borderRadius: '6px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {modelMessage}
          </div>
        )}
      </div>

      <textarea
        rows="10"
        value={text}
        onChange={handleTextChange}
        placeholder="Start typing..."
        style={{
          width: '80%',
          maxWidth: '800px',
          marginTop: '1rem',
          fontSize: '16px',
          backgroundColor: '#2b2f36',
          color: '#ffffff',
          padding: '1rem',
          border: '1px solid #555',
          borderRadius: '8px',
          resize: 'vertical'
        }}
      />
    </div>
  );
}

export default App;
