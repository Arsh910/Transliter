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
        
      <div style={{
        marginTop: '4rem',
        padding: '3rem',
        background: 'linear-gradient(to right, #1f1f1f, #2a2a2a)',
        color: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 0 30px rgba(0,0,0,0.5)',
        maxWidth: '900px',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          fontWeight: '700',
          color: '#00FFD1'
        }}>🔤 Real-Time Hindi Transliteration</h1>
      
        <p style={{
          fontSize: '1.25rem',
          lineHeight: '2rem',
          maxWidth: '800px',
          margin: '0 auto 2.5rem auto'
        }}>
          Convert Hindi written in the Latin script (like "namaste") to native Devanagari script (like "नमस्ते") as you type — word by word, automatically.
          Choose between two AI models, trained to understand transliteration nuances.
        </p>
      
        <h2 style={{
          fontSize: '2rem',
          color: '#FFEA00',
          marginBottom: '1rem'
        }}>📚 Examples</h2>
      
        <div style={{
          fontSize: '1.5rem',
          lineHeight: '2.25rem',
          fontFamily: 'monospace',
          marginBottom: '2rem'
        }}>
          <p><strong>namaste</strong> ➝ नमस्ते</p>
          <p><strong>sir</strong> ➝ सर</p>
          <p><strong>mera naam Rahul hai</strong> ➝ मेरा नाम राहुल है</p>
          <p><strong>kya haal hai</strong> ➝ क्या हाल है</p>
        </div>
      
        <h2 style={{
          fontSize: '2rem',
          color: '#FF6B81',
          marginBottom: '1rem'
        }}>💡 How It Works</h2>
      
        <p style={{
          fontSize: '1.25rem',
          lineHeight: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          This web app uses a character-level encoder-decoder model trained on Hindi transliterations. It's built with <strong>React.js</strong> and powered by a <strong>PyTorch + FastAPI</strong> backend.
          As you pause typing, each word gets sent to the server and comes back in Hindi — instantly and smartly.
        </p>
      </div>
      <div style={{
          marginTop: '4rem',
          padding: '2.5rem',
          background: '#111',
          borderRadius: '16px',
          color: '#fff',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          textAlign: 'center',
          maxWidth: '900px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#00FFFF',
            marginBottom: '1.5rem'
          }}>👨‍💻 Built With ❤️ By</h2>
        
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#1e1e1e',
              padding: '1.5rem',
              borderRadius: '12px',
              minWidth: '200px',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ margin: 0, color: '#FFD700' }}>Arshdeep Palial</h3>
            </div>
                        <div style={{
              background: '#1e1e1e',
              padding: '1.5rem',
              borderRadius: '12px',
              minWidth: '200px',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ margin: 0, color: '#FFD700' }}>Gaurav Yadav</h3>
            </div>
                        <div style={{
              background: '#1e1e1e',
              padding: '1.5rem',
              borderRadius: '12px',
              minWidth: '200px',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ margin: 0, color: '#FFD700' }}>Jaskaran Singh</h3>
            </div>
          </div>
        </div>
    </div>
  );
}

export default App;
