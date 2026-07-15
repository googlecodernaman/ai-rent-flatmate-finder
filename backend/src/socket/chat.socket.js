'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const chatService = require('../services/chat.service');

/**
 * Attach Socket.IO to the HTTP server.
 * Exported so server.js can call this after creating httpServer.
 *
 * Events:
 *   Client → Server: join_room, send_message
 *   Server → Client: receive_message, error
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : '*',
      methods: ['GET', 'POST'],
    },
  });

  // ── JWT authentication middleware ──────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token required'));
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // ── join_room ──────────────────────────────────────────────
    socket.on('join_room', async (interestId) => {
      try {
        if (!interestId || typeof interestId !== 'string') {
          return socket.emit('error', { message: 'interestId is required', code: 'INVALID_ROOM' });
        }
        // Verify access (ACCEPTED + participant)
        await chatService.verifyAccess(interestId, socket.user.id);
        socket.join(interestId);
        socket.emit('joined', { interestId });
      } catch (err) {
        socket.emit('error', { message: err.message, code: err.code || 'ERROR' });
      }
    });

    // ── send_message ───────────────────────────────────────────
    socket.on('send_message', async ({ interestId, content }) => {
      try {
        if (!interestId || !content) {
          return socket.emit('error', { message: 'interestId and content are required', code: 'INVALID_PAYLOAD' });
        }
        // Verify access again (in case client sends without joining)
        await chatService.verifyAccess(interestId, socket.user.id);
        const message = await chatService.saveMessage(interestId, socket.user.id, content);
        // Broadcast to all participants in the room (including sender)
        io.to(interestId).emit('receive_message', message);
      } catch (err) {
        socket.emit('error', { message: err.message, code: err.code || 'ERROR' });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
