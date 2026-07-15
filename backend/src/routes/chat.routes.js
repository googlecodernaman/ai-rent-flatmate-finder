'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/chat.controller');

const router = Router();

// GET /api/chats/:interestId — fetch paginated message history
router.get('/:interestId', authenticate, ctrl.getMessages);

module.exports = router;
