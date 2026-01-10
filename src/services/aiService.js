import openai from './openaiClient';

/**
 * Generate a realistic day-wise itinerary using OpenAI.
 * @param {Object} params - Trip parameters
 * @param {string} params.sourceCity - Starting city
 * @param {string} params.destinationCity - Destination city
 * @param {number} params.numberOfDays - Number of days
 * @param {string} params.travelType - Travel type (family/solo/couple/unknown)
 * @param {string} params.additionalContext - Additional context from intents
 * @returns {Promise<Object|null>} Itinerary object or null on failure
 */
async function generateAIItinerary({ sourceCity, destinationCity, numberOfDays, travelType, additionalContext = '' }) {
  try {
    const familyNote = travelType === 'family' 
      ? 'This is a family trip - keep activities family-friendly, safe, and suitable for all ages. Include kid-friendly spots and avoid late-night or intense activities.'
      : travelType === 'couple'
      ? 'This is a couple trip - include romantic spots, leisure activities, and experiences for two.'
      : travelType === 'solo'
      ? 'This is a solo trip - include flexible activities, social opportunities, and safe exploration options.'
      : 'Keep activities practical and enjoyable for general travelers.';

    const prompt = `You are a travel planning assistant. Generate a realistic, practical, and relaxed ${numberOfDays}-day itinerary for a trip from ${sourceCity} to ${destinationCity}.

${familyNote}

Guidelines:
- Day 1: Arrival, check-in, light exploration
- Middle days: Mix of sightseeing, local experiences, and relaxation
- Last day: Leisurely morning, pack up, departure
- Keep the pace relaxed - avoid cramming too many activities
- Include realistic activities that travelers can actually do
- Focus on popular attractions, local food, and cultural experiences${additionalContext}

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanation text.

Use this exact JSON structure:
{
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival and City Introduction",
      "plan": "Arrive in ${destinationCity}, check into your hotel, take an evening stroll around the neighborhood, and enjoy local cuisine at a nearby restaurant."
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning assistant. Always respond with valid JSON only. Never use markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6, // Lower temperature for more consistent, reliable outputs
      max_tokens: 1200, // Reasonable limit to prevent excessive token usage
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      // Safe error logging without exposing sensitive data
      console.warn('[AI Service] No content received from OpenAI');
      return null;
    }

    // Parse JSON response with error handling
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse JSON response');
      return null;
    }
    
    // Validate structure
    if (!parsed.itinerary || !Array.isArray(parsed.itinerary)) {
      console.warn('[AI Service] Invalid itinerary structure received');
      return null;
    }

    // Validate each day has required fields
    const isValid = parsed.itinerary.every(day => 
      typeof day.day === 'number' && 
      typeof day.title === 'string' && 
      typeof day.plan === 'string'
    );

    if (!isValid) {
      console.warn('[AI Service] Itinerary items missing required fields');
      return null;
    }

    return parsed;

  } catch (error) {
    // Safe error logging - never expose API keys or sensitive data
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.warn('[AI Service] Network error - falling back to non-AI logic');
    } else if (error.status === 401) {
      console.warn('[AI Service] Authentication error - check API key');
    } else if (error.status === 429) {
      console.warn('[AI Service] Rate limit exceeded - falling back');
    } else {
      console.warn('[AI Service] Error:', error.message || 'Unknown error');
    }
    
    // Always return null to allow fallback to non-AI logic
    return null;
  }
}

/**
 * Generate AI-powered explanation for why a trip plan works well.
 * @param {Object} tripPlan - Full trip plan object with parsed data, itinerary, flight, hotel
 * @returns {Promise<Array<string>|null>} Array of 2-3 bullet strings or null on failure
 */
async function explainTripPlanWithAI(tripPlan) {
  try {
    const { parsed, itinerary, flight, hotelArea } = tripPlan;
    
    if (!parsed?.destinationCity || !parsed?.numberOfDays) {
      console.warn('[AI Service] Insufficient trip data for explanation');
      return null;
    }

    const prompt = `You are a confident travel advisor. Explain in 2-3 short, simple bullet points why this trip plan works well for the traveler.

Trip Details:
- From: ${parsed.sourceCity || 'your city'} to ${parsed.destinationCity}
- Duration: ${parsed.numberOfDays} days
- Travel type: ${parsed.travelType || 'general'}
- Flight timing: ${flight?.timing || 'morning'}, ${flight?.type || 'direct'}
- Hotel area: ${hotelArea?.area || 'city center'}

Tone:
- Confident and decisive (not wishy-washy)
- Simple language (avoid jargon)
- Human and friendly (not robotic)
- Each bullet should be ONE sentence, max 15 words

Focus on:
- Why the duration is perfect
- Why the pace/style suits the traveler type
- Practical benefits (connectivity, convenience, experience)

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanation.

Use this exact JSON structure:
{
  "reasons": [
    "5 days gives you time to explore without rushing",
    "Direct morning flights mean you arrive fresh and ready"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a travel advisor. Always respond with valid JSON only. Be confident and simple. Never use markdown or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[AI Service] No content received for trip explanation');
      return null;
    }

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse explanation JSON');
      return null;
    }

    // Validate structure
    if (!result.reasons || !Array.isArray(result.reasons)) {
      console.warn('[AI Service] Invalid reasons structure');
      return null;
    }

    // Validate each reason is a string
    const isValid = result.reasons.every(reason => typeof reason === 'string');
    if (!isValid) {
      console.warn('[AI Service] Reasons contain non-string values');
      return null;
    }

    // Return 2-3 reasons only
    return result.reasons.slice(0, 3);

  } catch (error) {
    // Safe error logging
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.warn('[AI Service] Network error for explanation');
    } else if (error.status === 401) {
      console.warn('[AI Service] Authentication error');
    } else if (error.status === 429) {
      console.warn('[AI Service] Rate limit exceeded');
    } else {
      console.warn('[AI Service] Error:', error.message || 'Unknown error');
    }
    
    return null;
  }
}

/**
 * Refine an existing itinerary based on user preferences.
 * @param {Object} params - Refinement parameters
 * @param {Object} params.tripPlan - Existing trip plan with itinerary
 * @param {string} params.refinementType - Type of refinement: "budget", "relaxed", "add-day"
 * @returns {Promise<Object|null>} Refined itinerary object or null on failure
 */
async function refineItineraryWithAI({ tripPlan, refinementType }) {
  try {
    const { parsed, itinerary } = tripPlan;
    
    if (!parsed?.destinationCity || !itinerary?.plan) {
      console.warn('[AI Service] Insufficient data for refinement');
      return null;
    }

    let refinementPrompt = '';
    
    if (refinementType === 'budget') {
      refinementPrompt = `Make this itinerary more budget-friendly:
- Replace expensive activities with affordable alternatives
- Suggest budget dining options instead of fine dining
- Focus on free or low-cost attractions
- Keep the same structure and number of days
- Maintain the destination: ${parsed.destinationCity}`;
    } else if (refinementType === 'relaxed') {
      refinementPrompt = `Make this itinerary more relaxed and less rushed:
- Reduce number of activities per day
- Add more leisure time and breaks
- Replace intense activities with calm experiences
- Keep the same structure and number of days
- Maintain the destination: ${parsed.destinationCity}`;
    } else if (refinementType === 'add-day') {
      refinementPrompt = `Add one extra day to this itinerary:
- Current trip is ${parsed.numberOfDays} days
- Add a new day BEFORE the last day (which is departure)
- The new day should have meaningful activities
- Update the last day number to ${parsed.numberOfDays + 1}
- Maintain the destination: ${parsed.destinationCity}`;
    } else {
      console.warn('[AI Service] Unknown refinement type:', refinementType);
      return null;
    }

    const currentItinerary = JSON.stringify(itinerary.plan, null, 2);

    const prompt = `You are a travel planning assistant. Refine the following itinerary based on the user's request.

Current Itinerary:
${currentItinerary}

Refinement Request:
${refinementPrompt}

IMPORTANT Rules:
- Do NOT change the destination city (${parsed.destinationCity})
- Keep the exact same JSON structure
- Every day must have: day (number), title (string), plan (string)
- Respond with ONLY valid JSON. No markdown, no code blocks, no explanation.

Use this exact JSON structure:
{
  "itinerary": [
    {
      "day": 1,
      "title": "Short title",
      "plan": "Description of activities"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning assistant. Always respond with valid JSON only. Never change the destination city. Never use markdown or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[AI Service] No content received for refinement');
      return null;
    }

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse refinement JSON');
      return null;
    }

    // Validate structure
    if (!result.itinerary || !Array.isArray(result.itinerary)) {
      console.warn('[AI Service] Invalid refinement structure');
      return null;
    }

    // Validate each day has required fields
    const isValid = result.itinerary.every(day => 
      typeof day.day === 'number' && 
      typeof day.title === 'string' && 
      typeof day.plan === 'string'
    );

    if (!isValid) {
      console.warn('[AI Service] Refinement items missing required fields');
      return null;
    }

    return result;

  } catch (error) {
    // Safe error logging
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.warn('[AI Service] Network error for refinement');
    } else if (error.status === 401) {
      console.warn('[AI Service] Authentication error');
    } else if (error.status === 429) {
      console.warn('[AI Service] Rate limit exceeded');
    } else {
      console.warn('[AI Service] Error:', error.message || 'Unknown error');
    }
    
    return null;
  }
}

export { generateAIItinerary, explainTripPlanWithAI, refineItineraryWithAI };
