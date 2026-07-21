const express = require('express');
const router = express.Router();
const chatController = require('../chatbot/chat.controller');

router.post('/message', chatController.sendMessage);
router.post('/conversation', chatController.createConversation);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.deleteHistory);

module.exports = router;
