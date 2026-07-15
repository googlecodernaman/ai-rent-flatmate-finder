/**
 * Application-wide constants.
 * All magic numbers and configurable thresholds live here.
 */

const { env } = require('./env');

const constants = {
  // Compatibility scoring
  SCORE_THRESHOLD: env.SCORE_THRESHOLD,        // Score above which owner gets email notification
  SCORE_BUDGET_WEIGHT: 0.6,                    // Budget match contributes 60% to fallback score
  SCORE_LOCATION_WEIGHT: 0.4,                  // Location match contributes 40% to fallback score
  BATCH_SCORE_DELAY_MS: 4000,                  // Delay between LLM calls in batch (respects ~15 RPM)

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Chat
  MAX_MESSAGE_LENGTH: 2000,

  // Auth
  BCRYPT_ROUNDS: 12,

  // Upload
  MAX_PHOTO_SIZE_BYTES: 5 * 1024 * 1024,       // 5 MB per photo
  MAX_PHOTOS_PER_LISTING: 10,
  ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

module.exports = constants;
