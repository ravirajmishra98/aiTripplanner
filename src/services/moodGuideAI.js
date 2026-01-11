import openai from './openaiClient';

/**
 * Suggest a mood-based experience grounded in the user's location.
 * Returns ONLY the specified JSON structure.
 * Falls back to deterministic suggestions if AI is unavailable.
 */
export async function suggestMoodGuide({ mood, energy = 'medium', time = '1–2 hours', budget = '₹₹', city = '', area = '', coords = null, timeOfDay = 'unknown' }) {
  const model = 'gpt-4.1-nano';

  const prompt = `You are a mood-based travel guide.

Rules:
- Suggest practical experiences matching mood and energy.
- Ground in current city/location provided: ${city || 'unknown city'} ${area ? '(' + area + ')' : ''}${coords ? ' near coordinates ' + JSON.stringify(coords) : ''}.
- Focus on experiences: calm walk, cafe time, devotional visit, lively place, nature, museum, markets.
- Avoid clinical/motivational/therapeutic language; do not judge emotions.
- Keep tone calm, confident, practical.
- Use time labels exactly from input and cost levels from input.
- If exact place uncertain, prefer well-known neighborhoods, parks, waterfronts, promenades, or central areas of the provided city.
- Respect current local time: ${timeOfDay}. If night, avoid remote parks/hikes/closed attractions; prefer indoor or well-lit areas, promenades, cafes.

Input:
- mood: ${mood}
- energy: ${energy}
- time: ${time}
- budget: ${budget}
- city: ${city}
- area: ${area || 'hotel area or city center'}

JSON structure only (no extra keys, no prose):
{
  "mood": "",
  "suggestionType": "",
  "primarySuggestion": {
    "experience": "",
    "place": "",
    "timeRequired": "",
    "costLevel": ""
  },
  "whyItFits": [],
  "avoid": [],
  "backupOption": ""
}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON per the provided schema. Keep language calm, practical, and non-judgmental. Ground in the provided city/location.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No AI content');

    const parsed = JSON.parse(content);

    // Basic schema validation
    if (!parsed || !parsed.primarySuggestion || !Array.isArray(parsed.whyItFits) || !Array.isArray(parsed.avoid)) {
      throw new Error('Invalid AI JSON');
    }

    return parsed;
  } catch (err) {
    // Fallback deterministic logic
    const timeLabel = time || '1–2 hours';
    const costLevel = budget || '₹₹';

    const moodMap = {
      sad: {
        suggestionType: 'gentle-uplift',
        experience: (timeOfDay === 'night')
          ? 'quiet cafe with warm lighting; short stroll in a well-lit area'
          : (energy === 'low' ? 'quiet waterfront or park walk' : 'sunny cafe time with light snack'),
        avoid: ['crowded, noisy clubs', 'intense high-energy events', ...(timeOfDay === 'night' ? ['remote parks', 'closed attractions'] : [])]
      },
      neutral: {
        suggestionType: 'balanced-exploration',
        experience: (timeOfDay === 'night')
          ? 'evening market or waterfront promenade; dessert at a popular cafe'
          : (energy === 'low' ? 'museum or gallery stroll' : 'local market browsing and street food'),
        avoid: ['overly long commutes', 'high-pressure activities', ...(timeOfDay === 'night' ? ['remote, unlit areas'] : [])]
      },
      happy: {
        suggestionType: 'lively-experience',
        experience: (timeOfDay === 'night')
          ? 'lively, well-lit boulevard or promenade; late dessert spot'
          : (energy === 'high' ? 'vibrant promenade or festival area' : 'iconic neighborhood walk and dessert stop'),
        avoid: ['quiet, remote spots if seeking energy', ...(timeOfDay === 'night' ? ['isolated nightlife areas'] : [])]
      },
      tired: {
        suggestionType: 'restful-reset',
        experience: (timeOfDay === 'night')
          ? 'calm cafe/tea lounge or hotel lobby lounge; brief unwind'
          : 'calm garden or lakeside bench time + tea',
        avoid: ['long lines', 'intense hikes', 'late-night crowds']
      },
      frustrated: {
        suggestionType: 'decompress',
        experience: (timeOfDay === 'night')
          ? 'uncluttered, well-lit boulevard walk; simple snack break'
          : 'steady walk on a wide boulevard; simple street snack break',
        avoid: ['bureaucratic attractions', 'tight schedules', 'expensive formal venues', ...(timeOfDay === 'night' ? ['poorly lit areas'] : [])]
      },
      calm: {
        suggestionType: 'stillness',
        experience: (timeOfDay === 'night')
          ? 'peaceful temple (if open) or serene courtyard/cafe; unhurried sit-down'
          : 'peaceful temple or heritage courtyard; unhurried sit-down',
        avoid: ['noisy nightlife', 'packed malls', ...(timeOfDay === 'night' ? ['closed religious sites'] : [])]
      }
    };

    const pick = moodMap[mood] || moodMap.neutral;
    const cityLabel = city || 'your current city';
    const areaLabel = area ? ` (${area})` : '';

    return {
      mood,
      suggestionType: pick.suggestionType,
      primarySuggestion: {
        experience: pick.experience,
        place: `well-known area in ${cityLabel}${areaLabel}`,
        timeRequired: timeLabel,
        costLevel
      },
      whyItFits: [
        'Matches your current energy and keeps decisions simple',
        'Close-by, low-friction experience to avoid unnecessary travel',
        'Lets you pause and reset without pressure'
      ],
      avoid: pick.avoid,
      backupOption: (timeOfDay === 'night')
        ? 'If you prefer staying nearby, choose a well-lit promenade or cafe within 10–15 minutes of your stay.'
        : 'If you prefer staying nearby, choose a cafe or park within 10–15 minutes of your stay.'
    };
  }
}

export default suggestMoodGuide;
