'use strict';

const interestService = require('../services/interest.service');
const emailService = require('../services/email.service');

async function expressInterest(req, res, next) {
  try {
    const { listingId } = req.body;
    const interest = await interestService.expressInterest(req.user.id, listingId);
    res.status(201).json(interest);
  } catch (err) { next(err); }
}

async function getTenantInterests(req, res, next) {
  try {
    const interests = await interestService.getTenantInterests(req.user.id);
    res.json(interests);
  } catch (err) { next(err); }
}

async function getOwnerInterests(req, res, next) {
  try {
    const interests = await interestService.getOwnerInterests(req.user.id);
    res.json(interests);
  } catch (err) { next(err); }
}

async function acceptInterest(req, res, next) {
  try {
    const updated = await interestService.acceptInterest(req.params.id, req.user.id);
    // Fire-and-forget email to tenant
    emailService.sendInterestAcceptedEmail(
      updated.tenant.email,
      updated.tenant.name,
      updated.listing.title
    ).catch(console.error);
    res.json(updated);
  } catch (err) { next(err); }
}

async function declineInterest(req, res, next) {
  try {
    const updated = await interestService.declineInterest(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { expressInterest, getTenantInterests, getOwnerInterests, acceptInterest, declineInterest };
