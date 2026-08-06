const axios = require('axios');

const PRIMARY_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const CANDIDATE_HOSTS = Array.from(new Set([
  PRIMARY_HOST,
  'http://host.docker.internal:11434',
  'http://172.17.0.1:11434',
  'http://172.18.0.1:11434',
  'http://localhost:11434',
  'http://127.0.0.1:11434'
]));

const generateChatResponse = async (messages) => {
  let lastError = null;

  for (const hostUrl of CANDIDATE_HOSTS) {
    try {
      const response = await axios.post(`${hostUrl}/api/chat`, {
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false
      }, {
        timeout: 45000
      });

      if (response.data && response.data.message) {
        return response.data.message.content;
      }
    } catch (error) {
      lastError = error;
      console.warn(`[Ollama Discovery] Candidate host ${hostUrl} failed (${error.message}). Trying next...`);
    }
  }

  console.error('All Ollama Host candidates failed. Last error:', lastError?.message);
  throw lastError || new Error('All Ollama host candidates failed to respond.');
};

module.exports = {
  generateChatResponse
};
