const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function zeroShotPrompt(prompt) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
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
    console.error('Zero-shot Prompt Error:', err.response?.data || err.message);
    throw new Error('Gemini LLM request failed');
  }
}

// Example Usage
(async () => {
  const prompt = "Explain the difference between zero-shot, one-shot, and few-shot prompting in simple terms.";
  const output = await zeroShotPrompt(prompt);
  console.log("Zero-shot Response:", output);
})();
