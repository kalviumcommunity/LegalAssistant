const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function multiShotPromptLegal() {
  const examples = `
Q: Summarize this clause: "Either party may terminate this agreement with 30 days' written notice."
A: The agreement can be ended by either party with a 30-day written notice.

Q: Summarize this clause: "Confidential information shall not be disclosed to third parties without prior written consent."
A: Confidential information cannot be shared with third parties unless written consent is obtained.
`;

  const newQuestion = `
Q: Summarize this clause: "The service provider shall indemnify the client against any third-party claims arising from negligence."
A:
`;

  const prompt = `
You are a legal assistant. Use the examples to summarize legal clauses clearly.

Examples:
${examples}

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

    console.log("Legal Multi-shot Response:", response.data.candidates?.[0]?.content?.parts?.[0]?.text || '');
  } catch (err) {
    console.error('Legal Multi-shot Prompt Error:', err.response?.data || err.message);
  }
}

multiShotPromptLegal();
