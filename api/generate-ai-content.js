const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { prompt } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        params: { key: GEMINI_API_KEY }
      }
    );

    const generatedContent = response.data.candidates[0].content.parts[0].text;
    res.status(200).json({ content: generatedContent });
  } catch (error) {
    console.error('AIコンテンツ生成エラー:', error);
    res.status(500).json({ 
      error: 'AIコンテンツの生成に失敗しました',
      details: error.message,
      stack: error.stack
    });
  }
};
