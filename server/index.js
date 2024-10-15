// server/index.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/generate-ai-content', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        params: {
          key: GEMINI_API_KEY
        }
      }
    );

    const generatedContent = response.data.candidates[0].content.parts[0].text;
    res.json({ content: generatedContent });
  } catch (error) {
    console.error('Error generating AI content:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate AI content' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));