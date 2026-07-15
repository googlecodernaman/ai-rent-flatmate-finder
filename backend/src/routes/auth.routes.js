const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = Router();

// ── Validation schemas ────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['OWNER', 'TENANT'], {
    errorMap: () => ({ message: 'Role must be either OWNER or TENANT' }),
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Routes ────────────────────────────────────

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
