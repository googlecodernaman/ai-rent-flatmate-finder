const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getScore } = require('../controllers/compatibility.controller');

const router = Router();

// GET /api/compatibility/:listingId — TENANT only
router.get('/:listingId', authenticate, requireRole('TENANT'), getScore);

module.exports = router;
