'use strict';

const adminService = require('../services/admin.service');

async function getStats(req, res, next) {
  try { res.json(await adminService.getStats()); } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try { res.json(await adminService.listUsers(req.query)); } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    await adminService.deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
}

async function listListings(req, res, next) {
  try { res.json(await adminService.listListings(req.query)); } catch (err) { next(err); }
}

module.exports = { getStats, listUsers, deleteUser, listListings };
