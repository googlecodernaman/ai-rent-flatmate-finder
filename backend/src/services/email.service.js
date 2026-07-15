'use strict';

const { Resend } = require('resend');
const { env } = require('../config/env');

let resend = null;
if (env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY);
}

const FROM = env.EMAIL_FROM || 'onboarding@resend.dev';

/**
 * Send email via Resend. No-op if RESEND_API_KEY is missing.
 */
async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

/**
 * Owner notification: a tenant is highly compatible with their listing.
 */
async function sendHighCompatibilityEmail(ownerEmail, ownerName, tenantName, listingTitle, score) {
  await sendEmail({
    to: ownerEmail,
    subject: `High compatibility match for your listing: ${listingTitle}`,
    html: `
      <p>Hi ${ownerName},</p>
      <p>
        <strong>${tenantName}</strong> is highly compatible with your listing
        <strong>"${listingTitle}"</strong> (compatibility score: <strong>${score}/100</strong>).
      </p>
      <p>Log in to review their interest and respond.</p>
    `,
  });
}

/**
 * Tenant notification: owner accepted their interest request.
 */
async function sendInterestAcceptedEmail(tenantEmail, tenantName, listingTitle) {
  await sendEmail({
    to: tenantEmail,
    subject: `Your interest in "${listingTitle}" has been accepted!`,
    html: `
      <p>Hi ${tenantName},</p>
      <p>
        Great news! The owner has <strong>accepted</strong> your interest in
        <strong>"${listingTitle}"</strong>.
      </p>
      <p>You can now start chatting with the owner in the app.</p>
    `,
  });
}

module.exports = { sendHighCompatibilityEmail, sendInterestAcceptedEmail };
