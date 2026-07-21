const chatService = require('./chat.service');
const conversationManager = require('./conversation.manager');

const sendMessage = async (req, res) => {
  const { message, conversationId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await chatService.processMessage(conversationId, message);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat Controller sendMessage error:', error);
    return res.status(500).json({ error: 'Error processing chat message' });
  }
};

const createConversation = (req, res) => {
  try {
    const conversationId = conversationManager.createConversation();
    return res.status(201).json({ conversationId });
  } catch (error) {
    console.error('Chat Controller createConversation error:', error);
    return res.status(500).json({ error: 'Error initializing conversation' });
  }
};

const getHistory = (req, res) => {
  const { conversationId } = req.query;
  try {
    const history = conversationManager.getConversation(conversationId);
    return res.status(200).json(history);
  } catch (error) {
    console.error('Chat Controller getHistory error:', error);
    return res.status(500).json({ error: 'Error retrieving history' });
  }
};

const deleteHistory = (req, res) => {
  const { conversationId } = req.query;
  try {
    const cleared = conversationManager.clearHistory(conversationId);
    if (cleared) {
      return res.status(200).json({ success: true, message: 'History cleared successfully' });
    }
    return res.status(404).json({ error: 'Conversation not found' });
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
