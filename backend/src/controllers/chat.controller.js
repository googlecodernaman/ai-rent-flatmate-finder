'use strict';

const chatService = require('../services/chat.service');

async function getMessages(req, res, next) {
  try {
    const result = await chatService.getMessages(req.params.interestId, req.user.id, req.query);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { getMessages };
