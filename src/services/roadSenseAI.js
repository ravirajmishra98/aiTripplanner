import openai from './openaiClient';

/**
 * Judge road routes for long drives, returning STRICT JSON only.
 * Falls back to deterministic output when AI is unavailable.
 */
export async function judgeRoadRoutes({ start, destination, vehicleType, experienceLevel, priorities = [] }) {
  const model = 'gpt-4.1-nano';

  const prios = priorities && priorities.length ? priorities.join(', ') : 'none';

  const prompt = `You are Road Sense: a judgmental, practical guide for long drives.

Purpose:
- Compare multiple possible routes between ${start || 'start'} and ${destination || 'destination'}.
- Evaluate road condition, difficulty, risk & fatigue, vehicle suitability.
- Make ONE clear recommended route.
- Clearly call out a route to avoid and why.

Do NOT:
- Provide navigation steps or maps.
- Over-explain.

Context:
- vehicle: ${vehicleType || 'unknown'}
- experience: ${experienceLevel || 'unknown'}
- priorities: ${prios}

Output STRICT JSON ONLY (no prose, no extra keys):
{
  "recommendedRoute": {
    "summary": "",
    "difficulty": "easy | moderate | hard",
    "bestFor": [],
    "whyRecommended": [],
    "stops": []
  },
  "avoidRoute": {
    "summary": "",
    "reason": []
  },
  "roadWarnings": [],
  "confidence": "high | medium"
}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON with the exact schema provided. Focus on road judgment, not navigation. Keep language calm and practical.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 700,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No AI content');

    const parsed = JSON.parse(content);

    // Basic validation
    const hasRecommended = parsed?.recommendedRoute && Array.isArray(parsed?.recommendedRoute?.bestFor) && Array.isArray(parsed?.recommendedRoute?.stops);
    const hasAvoid = parsed?.avoidRoute && Array.isArray(parsed?.avoidRoute?.reason);
    const hasWarnings = Array.isArray(parsed?.roadWarnings);
    const hasConfidence = typeof parsed?.confidence === 'string';

    if (!hasRecommended || !hasAvoid || !hasWarnings || !hasConfidence) {
      throw new Error('Invalid JSON');
    }

    return parsed;
  } catch (err) {
    // Deterministic fallback
    const isBike = (vehicleType || '').toLowerCase() === 'bike';
    const isSUV = (vehicleType || '').toLowerCase() === 'suv';
    const exp = (experienceLevel || '').toLowerCase();
    const wantsSafe = priorities.includes('Safe roads');
    const wantsSmooth = priorities.includes('Smooth surface');
    const wantsScenic = priorities.includes('Scenic');
    const avoidBad = priorities.includes('Avoid bad roads');
    const monsoonFriendly = priorities.includes('Monsoon friendly');

    const difficulty = exp === 'beginner' ? 'easy' : exp === 'expert' ? 'hard' : 'moderate';

    const bestFor = [
      wantsSafe ? 'safety-first driving' : null,
      wantsSmooth ? 'smooth tarmac preference' : null,
      wantsScenic ? 'scenic views along the way' : null,
      monsoonFriendly ? 'monsoon-friendly detours' : null
    ].filter(Boolean);

    const stops = [
      'Fuel stop at a reliable station',
      wantsScenic ? 'Viewpoint on the safer, well-known stretch' : 'Short rest stop with food options',
      monsoonFriendly ? 'Check-point before hilly/low-lying section' : 'Final rest before last stretch'
    ];

    const avoidReasons = [
      avoidBad || wantsSafe ? 'Known rough patches and broken surfaces' : null,
      isBike ? 'Loose gravel and surprise potholes risky for bikes' : null,
      monsoonFriendly ? 'Waterlogging/landslide risks during rains' : null
    ].filter(Boolean);

    return {
      recommendedRoute: {
        summary: `Take the better-maintained arterial route between ${start || 'start'} and ${destination || 'destination'}; avoid poorly surfaced backroads.`,
        difficulty,
        bestFor: bestFor.length ? bestFor : ['balanced comfort'],
        whyRecommended: [
          wantsSmooth ? 'Consistently better tarmac reduces fatigue' : 'Predictable road quality reduces surprises',
          wantsSafe ? 'Fewer blind turns and better lighting in towns' : 'Clearer width and more regular traffic'
        ],
        stops
      },
      avoidRoute: {
        summary: 'Skip the interior shortcut with patchy surface and narrow sections',
        reason: avoidReasons.length ? avoidReasons : ['Higher fatigue due to constant corrections']
      },
      roadWarnings: [
        isBike ? 'Watch for sudden gravel near construction zones' : 'Beware of sudden speed-breakers around small towns',
        monsoonFriendly ? 'Check live monsoon advisories for susceptible sections' : 'Plan fuel and rest stops ahead'
      ],
      confidence: 'medium'
    };
  }
}

export default judgeRoadRoutes;
