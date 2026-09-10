const axios = require('axios');

const AI_PROVIDER = process.env.AI_PROVIDER || 'auto'; // 'auto', 'gemini', 'ollama'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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

// Generate Gemini API response
const generateGeminiResponse = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Format system prompt & conversation history for Gemini API
  let systemPrompt = '';
  const contents = [];

  messages.forEach(msg => {
    if (msg.role === 'system') {
      systemPrompt += msg.content + '\n\n';
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  });

  // Attach system prompt to the first user message if present
  if (systemPrompt && contents.length > 0) {
    contents[0].parts[0].text = `[SYSTEM INSTRUCTIONS]:\n${systemPrompt}\n[USER MESSAGE]:\n${contents[0].parts[0].text}`;
  }

  // Support multiple model fallback candidates
  const modelCandidates = Array.from(new Set([
    process.env.GEMINI_MODEL || GEMINI_MODEL,
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-pro'
  ]));

  let lastErr = null;
  for (const model of modelCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: contents
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          console.log(`[Gemini API Success] Model: ${model}`);
          return candidate.content.parts[0].text;
        }
      }
    } catch (err) {
      lastErr = err;
      console.warn(`[Gemini API Candidate Failed] Model ${model}: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  throw lastErr || new Error('Failed to generate response from Gemini API');
};

// Generate Ollama response
const generateOllamaResponse = async (messages) => {
  let lastError = null;

  for (const hostUrl of CANDIDATE_HOSTS) {
    try {
      const response = await axios.post(`${hostUrl}/api/chat`, {
        model: process.env.OLLAMA_MODEL || OLLAMA_MODEL,
        messages: messages,
        stream: false
      }, {
        timeout: 45000
      });

      if (response.data && response.data.message) {
        console.log(`[Ollama Success] Host: ${hostUrl}`);
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

// Master LLM Response Router (Gemini API -> Ollama -> Fallback)
const generateChatResponse = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  const provider = process.env.AI_PROVIDER || AI_PROVIDER;

  // 1. If Gemini API Key is provided or AI_PROVIDER === 'gemini'
  if (apiKey || provider === 'gemini') {
    try {
      return await generateGeminiResponse(messages);
    } catch (geminiErr) {
      console.warn(`[AI Router] Gemini API failed (${geminiErr.message}). Trying Ollama / local provider...`);
    }
  }

  // 2. Fallback to Local Ollama
  if (provider !== 'gemini') {
    try {
      return await generateOllamaResponse(messages);
    } catch (ollamaErr) {
      console.warn(`[AI Router] Ollama unavailable (${ollamaErr.message}). System will fallback to smart rule engine.`);
    }
  }

  throw new Error('No AI provider available (Gemini API key missing/failed & Ollama offline).');
};

module.exports = {
  generateChatResponse
};
