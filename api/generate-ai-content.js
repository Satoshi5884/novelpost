const axios = require('axios');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt } = JSON.parse(event.body);
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
    return {
      statusCode: 200,
      body: JSON.stringify({ content: generatedContent })
    };
  } catch (error) {
    console.error('AIコンテンツ生成エラー:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'AIコンテンツの生成に失敗しました',
        details: error.message
      })
    };
  }
};
