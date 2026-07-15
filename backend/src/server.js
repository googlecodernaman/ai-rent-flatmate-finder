const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');

const { env, validateEnv } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// ── Validate environment ──────────────────────────────────
validateEnv();

// ── Express app ───────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ── Global middleware ─────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : '*',
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files (uploaded photos) ────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const tenantProfileRoutes = require('./routes/tenantProfile.routes');
const listingRoutes = require('./routes/listing.routes');
const compatibilityRoutes = require('./routes/compatibility.routes');

app.use('/api/auth', authRoutes);
app.use('/api/tenant-profile', tenantProfileRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/compatibility', compatibilityRoutes);

// Routes will be added here as they are implemented:
// app.use('/api/interests', interestRoutes);
// app.use('/api/chats', chatRoutes);
// app.use('/api/admin', adminRoutes);

// ── 404 handler for unknown routes ────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
});

// ── Global error handler (must be last) ───────────────────
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
