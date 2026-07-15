'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const rateLimit = require('express-rate-limit');

const { env, validateEnv } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// ── Validate environment ──────────────────────────────────
validateEnv();

// ── Ensure uploads/ directory exists ─────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Express app ───────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ── Socket.IO ─────────────────────────────────────────────
const { initSocket } = require('./socket/chat.socket');
initSocket(httpServer);

// ── Global middleware ─────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : '*',
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Rate limiting ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later', code: 'RATE_LIMITED' } },
});

// ── Static files (uploaded photos) ────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────
const authRoutes          = require('./routes/auth.routes');
const tenantProfileRoutes = require('./routes/tenantProfile.routes');
const listingRoutes       = require('./routes/listing.routes');
const compatibilityRoutes = require('./routes/compatibility.routes');
const interestRoutes      = require('./routes/interest.routes');
const chatRoutes          = require('./routes/chat.routes');
const adminRoutes         = require('./routes/admin.routes');

app.use('/api/auth',           authLimiter, authRoutes);
app.use('/api/tenant-profile', tenantProfileRoutes);
app.use('/api/listings',       listingRoutes);
app.use('/api/compatibility',  compatibilityRoutes);
app.use('/api/interests',      interestRoutes);
app.use('/api/chats',          chatRoutes);
app.use('/api/admin',          adminRoutes);

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
});

// ── Global error handler (must be last) ──────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────
const PORT = env.PORT;

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Rent & Flatmate Finder API                 ║
  ║   Running on http://localhost:${PORT}            ║
  ║   Environment: ${env.NODE_ENV.padEnd(25)}    ║
  ╚══════════════════════════════════════════════╝
  `);
});

// Export for testing and Socket.IO integration
module.exports = { app, httpServer };
