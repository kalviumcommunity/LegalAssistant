require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-text-embedding-3';

// -------- Vector Store --------
const VECTOR_STORE_PATH = path.resolve('vectorstore.json');
const loadVectorStore = () => {
  try { return JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, 'utf8')) } 
  catch { return [] }
};
const saveVectorStore = (store) => fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

// -------- Health Check --------
app.get('/', (req, res) => {
  res.json({ message: 'Intelligent Legal Assistant Backend running with Gemini AI' });
});

// -------- File Upload --------
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const filepath = path.resolve(req.file.path);
  try {
    let text = '';
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === '.pdf') {
      const data = fs.readFileSync(filepath);
      const pdf = await pdfParse(data);
      text = pdf.text;
    } else {
      text = fs.readFileSync(filepath, 'utf8');
    }
    fs.unlinkSync(filepath);
    res.json({ text });
  } catch (err) {
    fs.existsSync(filepath) && fs.unlinkSync(filepath);
    console.error(err);
    res.status(500).json({ error: 'failed to parse file', details: err.message });
  }
});

// -------- Gemini LLM Chat --------
const geminiChat = async (
  prompt,
  maxTokens = 800,
  temperature = 0.7,
  topP = 0.9,
  topK = 40
) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          topP,
          topK,
          maxOutputTokens: maxTokens
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.error('Gemini Chat Error:', err.response?.data || err.message);
    throw new Error('Gemini LLM request failed');
  }
};

// -------- Summarize Contract --------
app.post('/api/summarize/llm', async (req, res) => {
  const { text, temperature, topP, topK } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const prompt = `Summarize this contract into JSON with fields: parties (array), key_obligations (bullets), termination (short), liabilities (short), governing_law (if present), top_sentences (array). Contract Text:\n${text.slice(0, 20000)}`;
    const content = await geminiChat(prompt, 800, temperature ?? 0.7, topP ?? 0.9, topK ?? 40);
    try {
      const parsed = JSON.parse(content);
      res.json({ summary: parsed });
    } catch {
      res.json({ raw: content });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gemini API call failed', details: err.message });
  }
});

// -------- Gemini Embeddings --------
const geminiEmbedding = async (text) => {
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent',
      {
        model: 'models/embedding-001',
        content: { parts: [{ text }] }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    return response.data.embedding?.values || [];
  } catch (err) {
    console.error('Gemini Embedding Error:', err.response?.data || err.message);
    throw new Error('Gemini embedding request failed');
  }
};

// -------- Index Endpoint --------
app.post('/api/index', async (req, res) => {
  const { id, text } = req.body;
  if (!id || !text) return res.status(400).json({ error: 'id and text required' });
  try {
    const parts = text.split(/\n\n+/).filter(Boolean);
    const store = loadVectorStore();
    for (let i = 0; i < parts.length; i++) {
      const chunk = parts[i].slice(0, 2000);
      const embedding = await geminiEmbedding(chunk);
      store.push({ id: `${id}::${i}`, parentId: id, text: chunk, embedding });
    }
    saveVectorStore(store);
    res.json({ message: 'indexed', added: parts.length });
  } catch (err) {
    res.status(500).json({ error: 'embedding failed', details: err.message });
  }
});

// -------- Query Endpoint --------
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);

app.post('/api/query', async (req, res) => {
  const { query, topK, temperature, topP, modelTopK } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  try {
    const qEmb = await geminiEmbedding(query);
    const store = loadVectorStore();
    const scored = store.map(item => ({ ...item, score: dot(qEmb, item.embedding) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK || 3);
    const context = top.map(t => t.text).join('\n\n');
    const prompt = `Answer the question using CONTEXT (excerpts from indexed contracts). If not found, say "not found in documents".\n\nCONTEXT:\n${context}\n\nQUESTION:\n${query}`;
    const answer = await geminiChat(prompt, 500, temperature ?? 0.7, topP ?? 0.9, modelTopK ?? 40);
    res.json({ answer, results: top });
  } catch (err) {
    res.status(500).json({ error: 'query failed', details: err.message });
  }
});

app.listen(PORT, () => console.log('Server listening on', PORT));
