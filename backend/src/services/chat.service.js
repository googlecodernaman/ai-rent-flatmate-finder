'use strict';

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, MAX_MESSAGE_LENGTH } = require('../config/constants');

/**
 * Verify the interest exists, is ACCEPTED, and the requesting user
 * is either the tenant or the owner.
 */
async function verifyAccess(interestId, userId) {
  const interest = await prisma.interestRequest.findUnique({
    where: { id: interestId },
  });
  if (!interest) throw new AppError('Conversation not found', 404, 'INTEREST_NOT_FOUND');
  if (interest.status !== 'ACCEPTED') throw new AppError('Chat is only available for accepted interests', 403, 'NOT_ACCEPTED');
  if (interest.tenantId !== userId && interest.ownerId !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  return interest;
}

/**
 * Persist and return a new chat message.
 */
async function saveMessage(interestId, senderId, content) {
  if (!content || content.trim().length === 0) throw new AppError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
  if (content.length > MAX_MESSAGE_LENGTH) throw new AppError(`Message exceeds ${MAX_MESSAGE_LENGTH} characters`, 400, 'MESSAGE_TOO_LONG');

  return prisma.chatMessage.create({
    data: { interestId, senderId, content: content.trim() },
    include: { sender: { select: { id: true, name: true } } },
  });
}

/**
 * Fetch paginated message history for a conversation.
 */
async function getMessages(interestId, userId, query) {
  await verifyAccess(interestId, userId);

  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(parseInt(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { interestId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: { sender: { select: { id: true, name: true } } },
    }),
    prisma.chatMessage.count({ where: { interestId } }),
  ]);

  return {
    data: messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

module.exports = { verifyAccess, saveMessage, getMessages };
