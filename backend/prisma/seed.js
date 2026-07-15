'use strict';

/**
 * Seed script for Rent & Flatmate Finder.
 * Run via: npm run db:seed  (which calls: node prisma/seed.js)
 *
 * Creates:
 *   - 1 ADMIN
 *   - 3 OWNERs
 *   - 5 TENANTs (each with a TenantProfile)
 *   - 9 listings (varied locations, rents, room types)
 *   - Compatibility scores for all tenant-listing pairs (rule-based)
 *   - 4 interest requests (mix of PENDING/ACCEPTED/DECLINED)
 *   - Sample chat messages for the ACCEPTED interest
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────

function hash(password) {
  return bcrypt.hash(password, 10);
}

function fallbackScore(profile, listing) {
  const budgetMatch = listing.rent >= profile.budgetMin && listing.rent <= profile.budgetMax;
  const loc1 = listing.location.toLowerCase();
  const loc2 = profile.preferredLocation.toLowerCase();
  const locationMatch = loc1.includes(loc2) || loc2.includes(loc1);
  const score = Math.round((budgetMatch ? 100 : 0) * 0.6 + (locationMatch ? 100 : 0) * 0.4);
  const parts = [];
  if (budgetMatch) parts.push('rent is within budget'); else parts.push('rent is outside budget range');
  if (locationMatch) parts.push('location matches preference'); else parts.push('location does not match preference');
  return { score, explanation: `Rule-based score: ${parts.join('; ')}.` };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // Clear in safe order (cascade handles most, but explicit order avoids FK issues)
  await prisma.chatMessage.deleteMany();
  await prisma.interestRequest.deleteMany();
  await prisma.compatibilityScore.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.tenantProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────
  const PASSWORD = await hash('password123');

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', passwordHash: PASSWORD, role: 'ADMIN' },
  });

  const [owner1, owner2, owner3] = await Promise.all([
    prisma.user.create({ data: { name: 'Rahul Sharma', email: 'rahul@example.com', passwordHash: PASSWORD, role: 'OWNER' } }),
    prisma.user.create({ data: { name: 'Priya Nair', email: 'priya@example.com', passwordHash: PASSWORD, role: 'OWNER' } }),
    prisma.user.create({ data: { name: 'Arjun Mehta', email: 'arjun@example.com', passwordHash: PASSWORD, role: 'OWNER' } }),
  ]);

  const tenantData = [
    { name: 'Sneha Patel', email: 'sneha@example.com', location: 'Koramangala', min: 10000, max: 20000 },
    { name: 'Vikram Das', email: 'vikram@example.com', location: 'Indiranagar', min: 15000, max: 25000 },
    { name: 'Divya Menon', email: 'divya@example.com', location: 'HSR Layout', min: 8000, max: 15000 },
    { name: 'Rohan Joshi', email: 'rohan@example.com', location: 'Whitefield', min: 20000, max: 35000 },
    { name: 'Aisha Khan', email: 'aisha@example.com', location: 'BTM Layout', min: 12000, max: 22000 },
  ];

  const tenants = [];
  const profiles = [];
  for (const t of tenantData) {
    const user = await prisma.user.create({
      data: { name: t.name, email: t.email, passwordHash: PASSWORD, role: 'TENANT' },
    });
    const profile = await prisma.tenantProfile.create({
      data: {
        userId: user.id,
        preferredLocation: t.location,
        budgetMin: t.min,
        budgetMax: t.max,
        moveInDate: new Date('2025-09-01'),
      },
    });
    tenants.push(user);
    profiles.push({ ...profile, preferredLocation: t.location, budgetMin: t.min, budgetMax: t.max });
  }
  console.log('  ✓ Users & tenant profiles created');

  // ── Listings ────────────────────────────────────────────────────────
  const listingData = [
    { ownerId: owner1.id, title: 'Cozy Studio in Koramangala', location: 'Koramangala', rent: 15000, roomType: 'STUDIO', furnishingStatus: 'FURNISHED' },
    { ownerId: owner1.id, title: 'Single Room near Indiranagar Metro', location: 'Indiranagar', rent: 18000, roomType: 'SINGLE', furnishingStatus: 'SEMI_FURNISHED' },
    { ownerId: owner1.id, title: 'Shared Room in BTM Layout', location: 'BTM Layout', rent: 9000, roomType: 'SHARED', furnishingStatus: 'UNFURNISHED' },
    { ownerId: owner2.id, title: 'Furnished Studio HSR Layout', location: 'HSR Layout', rent: 13000, roomType: 'STUDIO', furnishingStatus: 'FURNISHED' },
    { ownerId: owner2.id, title: 'Premium Single Room Whitefield', location: 'Whitefield', rent: 28000, roomType: 'SINGLE', furnishingStatus: 'FURNISHED' },
    { ownerId: owner2.id, title: 'Budget Shared Room BTM', location: 'BTM Layout', rent: 7500, roomType: 'SHARED', furnishingStatus: 'UNFURNISHED' },
    { ownerId: owner3.id, title: 'Modern Studio Koramangala 5th Block', location: 'Koramangala', rent: 19500, roomType: 'STUDIO', furnishingStatus: 'FURNISHED' },
    { ownerId: owner3.id, title: 'Semi-Furnished Room Indiranagar', location: 'Indiranagar', rent: 22000, roomType: 'SINGLE', furnishingStatus: 'SEMI_FURNISHED' },
    { ownerId: owner3.id, title: 'Affordable Shared Whitefield', location: 'Whitefield', rent: 11000, roomType: 'SHARED', furnishingStatus: 'SEMI_FURNISHED' },
  ];

  const listings = [];
  for (const l of listingData) {
    const listing = await prisma.listing.create({
      data: { ...l, photos: [], availableFrom: new Date('2025-09-01') },
    });
    listings.push(listing);
  }
  console.log('  ✓ Listings created');

  // ── Compatibility scores ────────────────────────────────────────────
  for (let ti = 0; ti < tenants.length; ti++) {
    const profile = profiles[ti];
    for (const listing of listings) {
      const { score, explanation } = fallbackScore(profile, listing);
      await prisma.compatibilityScore.create({
        data: {
          tenantId: tenants[ti].id,
          listingId: listing.id,
          score,
          explanation,
          isFallback: true,
        },
      });
    }
  }
  console.log('  ✓ Compatibility scores computed');

  // ── Interest requests ───────────────────────────────────────────────
  // Sneha → listing[0] (Koramangala studio) — ACCEPTED
  const acceptedInterest = await prisma.interestRequest.create({
    data: {
      tenantId: tenants[0].id,
      listingId: listings[0].id,
      ownerId: listings[0].ownerId,
      status: 'ACCEPTED',
    },
  });

  // Vikram → listing[1] (Indiranagar) — PENDING
  await prisma.interestRequest.create({
    data: {
      tenantId: tenants[1].id,
      listingId: listings[1].id,
      ownerId: listings[1].ownerId,
      status: 'PENDING',
    },
  });

  // Divya → listing[3] (HSR Layout) — PENDING
  await prisma.interestRequest.create({
    data: {
      tenantId: tenants[2].id,
      listingId: listings[3].id,
      ownerId: listings[3].ownerId,
      status: 'PENDING',
    },
  });

  // Rohan → listing[4] (Whitefield premium) — DECLINED
  await prisma.interestRequest.create({
    data: {
      tenantId: tenants[3].id,
      listingId: listings[4].id,
      ownerId: listings[4].ownerId,
      status: 'DECLINED',
    },
  });

  console.log('  ✓ Interest requests created');

  // ── Chat messages for accepted interest ────────────────────────────
  const chatMessages = [
    { senderId: tenants[0].id, content: 'Hi! I\'m very interested in the studio. Is it still available?' },
    { senderId: listings[0].ownerId, content: 'Yes, it\'s available! When would you like to visit?' },
    { senderId: tenants[0].id, content: 'This weekend works for me. How about Saturday at 11am?' },
    { senderId: listings[0].ownerId, content: 'Saturday 11am is perfect. I\'ll share my contact details shortly.' },
  ];

  for (const msg of chatMessages) {
    await prisma.chatMessage.create({
      data: { interestId: acceptedInterest.id, ...msg },
    });
  }
  console.log('  ✓ Chat messages created');

  console.log('\n✅ Seed complete!\n');
  console.log('Test credentials (all passwords: password123):');
  console.log(`  ADMIN:  admin@example.com`);
  console.log(`  OWNER:  rahul@example.com, priya@example.com, arjun@example.com`);
  console.log(`  TENANT: sneha@example.com, vikram@example.com, divya@example.com, rohan@example.com, aisha@example.com`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
