const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');

let genAI = null;

function getClient() {
  if (!env.GEMINI_API_KEY) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI;
}

/**
 * Calls Gemini Flash to compute a compatibility score.
 *
 * @param {object} tenantProfile - { preferredLocation, budgetMin, budgetMax, moveInDate }
 * @param {object} listing       - { title, location, rent, roomType, furnishingStatus, availableFrom }
 * @returns {{ score: number, explanation: string } | null} null if unavailable/failed
 */
async function getCompatibilityScore(tenantProfile, listing) {
  const client = getClient();
  if (!client) return null;

  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const prompt = buildPrompt(tenantProfile, listing);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse and validate JSON response
    const parsed = JSON.parse(text);
    const score = parseInt(parsed.score, 10);

    if (isNaN(score) || score < 0 || score > 100) {
      console.warn('[gemini] Invalid score value:', parsed.score);
      return null;
    }

    const explanation = typeof parsed.explanation === 'string' && parsed.explanation.trim()
      ? parsed.explanation.trim()
      : 'Score computed by AI.';

    return { score, explanation };
  } catch (err) {
    console.warn('[gemini] Score computation failed, will use fallback:', err.message);
    return null;
  }
}

function buildPrompt(tenantProfile, listing) {
  return `You are evaluating apartment rental compatibility. Respond ONLY with valid JSON matching exactly: {"score": <integer 0-100>, "explanation": "<2 sentences max>"}

TENANT PREFERENCES:
- Preferred location: ${tenantProfile.preferredLocation}
- Budget: ₹${tenantProfile.budgetMin}–₹${tenantProfile.budgetMax}/month
- Move-in date: ${new Date(tenantProfile.moveInDate).toDateString()}

LISTING:
- Title: ${listing.title}
- Location: ${listing.location}
- Rent: ₹${listing.rent}/month
- Room type: ${listing.roomType}
- Furnishing: ${listing.furnishingStatus}
- Available from: ${new Date(listing.availableFrom).toDateString()}

Score how well this listing matches the tenant's needs. 100 = perfect match, 0 = completely incompatible. Be objective.`;
}

module.exports = { getCompatibilityScore };
