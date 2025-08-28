const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function oneShotPromptLegal() {
  const example = `
Q: Summarize this clause: "Either party may terminate this agreement with 30 days' written notice."
A: The agreement can be ended by either party with a 30-day written notice.
`;

  const newQuestion = `
Q: Summarize this clause: "The service provider shall indemnify the client against any third-party claims arising from negligence."
A:
`;

  const prompt = `
You are a legal assistant. Use the example format to summarize legal clauses clearly.

Example:
${example}

Now answer the following:
${newQuestion}
`;

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

    console.log("Legal One-shot Response:", response.data.candidates?.[0]?.content?.parts?.[0]?.text || '');
  } catch (err) {
    console.error('Legal One-shot Prompt Error:', err.response?.data || err.message);
  }
}

oneShotPromptLegal();
