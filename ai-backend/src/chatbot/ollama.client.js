const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

const generateChatResponse = async (messages) => {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: false,
      format: 'json'
    }, {
      timeout: 5000 // 5 seconds timeout to trigger fallback quickly if Ollama is not up
    });

    if (response.data && response.data.message) {
      return response.data.message.content;
    }
    throw new Error('Invalid response format from Ollama');
  } catch (error) {
    console.error('Ollama Client Error:', error.message);
    throw error;
  }
};

module.exports = {
  generateChatResponse
};
