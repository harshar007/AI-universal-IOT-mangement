const crypto = require('crypto');

class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.activeConversationId = null;
  }

  createConversation() {
    const conversationId = crypto.randomUUID();
    this.conversations.set(conversationId, [
      {
        id: 'init',
        sender: 'ai',
        text: 'Nunnarri IoT AI Core online. I am monitoring 8 active channels. You can issue commands to adjust temperature, optimize energy consumption, or request diagnostics.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    this.activeConversationId = conversationId;
    return conversationId;
  }

  getConversation(conversationId) {
    const id = conversationId || this.activeConversationId || this.createConversation();
    if (!this.conversations.has(id)) {
      this.conversations.set(id, [
        {
          id: 'init',
          sender: 'ai',
          text: 'Nunnarri IoT AI Core online. I am monitoring 8 active channels. You can issue commands to adjust temperature, optimize energy consumption, or request diagnostics.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    return { conversationId: id, messages: this.conversations.get(id) };
  }

  addMessage(conversationId, message) {
    const { conversationId: id, messages } = this.getConversation(conversationId);
    messages.push(message);
    this.conversations.set(id, messages);
    return messages;
  }

  clearHistory(conversationId) {
    const id = conversationId || this.activeConversationId;
    if (id && this.conversations.has(id)) {
      this.conversations.set(id, [
        {
          id: 'init',
          sender: 'ai',
          text: 'Nunnarri IoT AI Core online. I am monitoring 8 active channels. You can issue commands to adjust temperature, optimize energy consumption, or request diagnostics.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return true;
    }
    return false;
  }
}

module.exports = new ConversationManager();
