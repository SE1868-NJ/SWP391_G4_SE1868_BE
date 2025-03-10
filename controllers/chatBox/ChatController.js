const axios = require('axios');

exports.handleChatRequest = async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: message }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Trích xuất văn bản từ phản hồi
    const text = response.data.candidates[0].content.parts[0].text;

    res.json({ message: text });

  } catch (error) {
    console.error('Chi tiết lỗi:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    res.status(500).json({ 
      error: 'Lỗi xử lý yêu cầu',
      details: error.response?.data || error.message
    });
  }
};