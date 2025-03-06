const express = require('express');
const { handleChatRequest } = require('./ChatController');

const router = express.Router();

router.post('/chat', handleChatRequest);

module.exports = router;