const { Router } = require('express');
const { z } = require('zod');
const listingController = require('../controllers/listing.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { MAX_PHOTOS_PER_LISTING } = require('../config/constants');

const router = Router();

// ── Validation schemas ─────────────────────────

const ROOM_TYPES = ['SINGLE', 'SHARED', 'STUDIO'];
const FURNISHING_STATUSES = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];

const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().min(2).max(200),
  rent: z.coerce.number().int().min(1, 'Rent must be positive'),
  availableFrom: z.string().datetime({ message: 'availableFrom must be ISO 8601 datetime' }),
  roomType: z.enum(ROOM_TYPES, { errorMap: () => ({ message: `roomType must be one of: ${ROOM_TYPES.join(', ')}` }) }),
  furnishingStatus: z.enum(FURNISHING_STATUSES, { errorMap: () => ({ message: `furnishingStatus must be one of: ${FURNISHING_STATUSES.join(', ')}` }) }),
});

const updateListingSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().min(2).max(200).optional(),
  rent: z.coerce.number().int().min(1).optional(),
  availableFrom: z.string().datetime().optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  furnishingStatus: z.enum(FURNISHING_STATUSES).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

// ── Owner routes ───────────────────────────────

router.post(
  '/',
  authenticate, requireRole('OWNER'),
  upload.array('photos', MAX_PHOTOS_PER_LISTING),
  validate(createListingSchema),
  listingController.createListing
);

router.get('/my', authenticate, requireRole('OWNER'), listingController.getOwnerListings);

router.put(
  '/:id',
  authenticate, requireRole('OWNER'),
  upload.array('photos', MAX_PHOTOS_PER_LISTING),
  validate(updateListingSchema),
  listingController.updateListing
);

router.delete('/:id', authenticate, requireRole('OWNER'), listingController.deleteListing);

router.patch('/:id/fill', authenticate, requireRole('OWNER'), listingController.markFilled);

// ── Tenant routes ──────────────────────────────

router.get('/', authenticate, requireRole('TENANT'), listingController.browseListings);

router.get('/:id', authenticate, requireRole('TENANT'), listingController.getListingById);

module.exports = router;
