const express = require('express');
const router = express.Router();
const chatController = require('../chatbot/chat.controller');
const auth = require('../middleware/auth');

router.post('/message', auth, chatController.sendMessage);
router.post('/conversation', auth, chatController.createConversation);
router.get('/history', auth, chatController.getHistory);
router.delete('/history', auth, chatController.deleteHistory);

module.exports = router;
