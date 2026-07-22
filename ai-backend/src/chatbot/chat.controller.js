const chatService = require('./chat.service');
const { pool } = require('../config/db');

const sendMessage = async (req, res) => {
  const { message } = req.body;
  const userId = req.user?.userId;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await chatService.processMessage(String(userId), message);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat Controller sendMessage error:', error);
    return res.status(500).json({ error: 'Error processing chat message' });
  }
};

const createConversation = (req, res) => {
  const userId = req.user?.userId;
  try {
    // Return authenticated userId as the conversation ID for tenant separation
    return res.status(201).json({ conversationId: String(userId) });
  } catch (error) {
    console.error('Chat Controller createConversation error:', error);
    return res.status(500).json({ error: 'Error initializing conversation' });
  }
};

const getHistory = async (req, res) => {
  const userId = req.user?.userId;
  try {
    // Load conversation history from DB
    const queryText = `
      SELECT id, sender, text, commands, timestamp 
      FROM chat_messages 
      WHERE user_id = $1 
      ORDER BY timestamp ASC
    `;
    const result = await pool.query(queryText, [String(userId)]);
    
    let messages = result.rows.map(row => ({
      id: String(row.id),
      sender: row.sender,
      text: row.text,
      commands: row.commands || [],
      timestamp: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // If no messages exist, seed the default AI message
    if (messages.length === 0) {
      const welcomeText = 'Nexus Autonomous AI Controller is active. I am continuously monitoring telemetry streams across your IoT devices. You can configure AI automation profiles above or command me directly using natural language below!';
      const insertText = `
        INSERT INTO chat_messages (user_id, sender, text, commands)
        VALUES ($1, 'ai', $2, '[]'::jsonb)
        RETURNING id, timestamp
      `;
      const insertRes = await pool.query(insertText, [String(userId), welcomeText]);
      const newRow = insertRes.rows[0];
      messages = [{
        id: String(newRow.id),
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date(newRow.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    }

    return res.status(200).json({ conversationId: String(userId), messages });
  } catch (error) {
    console.error('Chat Controller getHistory error:', error);
    return res.status(500).json({ error: 'Error retrieving history' });
  }
};

const deleteHistory = async (req, res) => {
  const userId = req.user?.userId;
  try {
    const queryText = 'DELETE FROM chat_messages WHERE user_id = $1';
    await pool.query(queryText, [String(userId)]);
    return res.status(200).json({ success: true, message: 'History cleared successfully' });
  } catch (error) {
    console.error('Chat Controller deleteHistory error:', error);
    return res.status(500).json({ error: 'Error clearing history' });
  }
};

module.exports = {
  sendMessage,
  createConversation,
  getHistory,
  deleteHistory
};
