'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/admin.controller');

const router = Router();

// All admin routes require JWT + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.listUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/listings', ctrl.listListings);

module.exports = router;
