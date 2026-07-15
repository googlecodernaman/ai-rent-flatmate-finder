const { PrismaClient } = require('@prisma/client');

/**
 * Prisma client singleton.
 *
 * Prisma 6.x auto-detects Neon connection strings and uses the
 * Neon serverless HTTP driver internally — no manual adapter needed.
 *
 * In development, reuse the client across nodemon restarts via global caching.
 */

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
