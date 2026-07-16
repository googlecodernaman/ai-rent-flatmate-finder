const { Router } = require('express');
const { z } = require('zod');
const tenantProfileController = require('../controllers/tenantProfile.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

const router = Router();

// ── Validation schemas ────────────────────────

const createProfileSchema = z.object({
  intent: z.enum(['ENTIRE_PROPERTY', 'ROOMMATE']).default('ENTIRE_PROPERTY'),
  preferredLocation: z.string().min(2, 'Preferred location must be at least 2 characters').max(200),
  budgetMin: z.number({ required_error: 'budgetMin is required' }).int().min(0, 'budgetMin must be non-negative'),
  budgetMax: z.number({ required_error: 'budgetMax is required' }).int().min(1, 'budgetMax must be at least 1'),
  moveInDate: z.string({ required_error: 'moveInDate is required' }).datetime({ message: 'moveInDate must be a valid ISO 8601 datetime' }),
});

// All fields optional for update — service handles partial merge
const updateProfileSchema = z.object({
  intent: z.enum(['ENTIRE_PROPERTY', 'ROOMMATE']).optional(),
  preferredLocation: z.string().min(2).max(200).optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(1).optional(),
  moveInDate: z.string().datetime({ message: 'moveInDate must be a valid ISO 8601 datetime' }).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// All routes require JWT + TENANT role
router.use(authenticate, requireRole('TENANT'));

// POST /api/tenant-profile
router.post('/', validate(createProfileSchema), tenantProfileController.createProfile);

// GET /api/tenant-profile
router.get('/', tenantProfileController.getProfile);

// PUT /api/tenant-profile
router.put('/', validate(updateProfileSchema), tenantProfileController.updateProfile);

module.exports = router;
