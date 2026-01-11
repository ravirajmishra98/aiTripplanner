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

    const prompt = `Generate a ${numberOfDays}-day itinerary for ${sourceCity} to ${destinationCity}.

${familyNote}

Grounding requirements (no exceptions):
- Each time block must name real, destination-specific landmarks, attractions, neighborhoods, or famous experiences. No generic placeholders.
- Always include well-known, iconic, must-visit places for the destination city across the trip.
- Forbid vague actions like "walk around" unless tied to a named place/area (e.g., "stroll the Colaba Causeway markets").
- Balance sightseeing, food, culture, and downtime; keep a relaxed, realistic pace (max 1-2 anchor stops per block).

Day structure (concise, scannable):
- Morning (8-12): Specific landmark/museum/temple/park + short why relevant.
- Afternoon (12-5): Named attraction + food stop with a specific dish or cuisine at a real/typical place.
- Evening (5-10): Named neighborhood/market/waterfront/show + dinner spot or street-food lane.

Trip flow rules:
- Day 1: Arrival logistics, light exploration near stay, one iconic/easy nearby highlight.
- Middle days: Cover top landmarks + a local cultural/food experience each day.
- Last day: One meaningful stop, checkout, and departure prep.
- Be realistic about travel time and energy.

Output format (JSON only, no prose):
"plan": "Morning: [specific place + brief activity]. Afternoon: [specific place + food dish at venue/type]. Evening: [specific area/market/show + dinner at named/typical spot]."

Respond with ONLY valid JSON. No markdown, no explanations.

{
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival & First Impressions",
      "plan": "Afternoon: Check-in, rest. Evening: Explore [named area] near stay; dinner at [specific/typical spot] for [dish]."
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You generate travel itineraries. Output valid JSON only. Be specific with place names, activities, and food. Use time blocks (Morning/Afternoon/Evening). No markdown, no filler text.'
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

    const prompt = `Explain why this trip plan is well-designed. Give 2-3 concrete benefits.

Trip: ${parsed.sourceCity || 'Home'} → ${parsed.destinationCity}, ${parsed.numberOfDays} days, ${parsed.travelType || 'leisure'}
Flight: ${flight?.timing || 'morning'} ${flight?.type || 'direct'}
Stay: ${hotelArea?.area || 'central area'}

Format rules:
- Each reason = ONE benefit in 10-15 words
- Start with the practical advantage (no fluff)
- Focus on time, convenience, location, or experience quality
- Be specific to THIS trip's details

Good: "${parsed.numberOfDays} days covers key sights with time to relax"
Bad: "This trip offers a balanced pace for exploration"

Good: "${hotelArea?.area || 'Central location'} puts you within walking distance of main attractions"
Bad: "The hotel area is convenient for tourists"

Respond with ONLY valid JSON:
{
  "reasons": [
    "Specific concrete benefit 1",
    "Specific concrete benefit 2"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You explain travel plans concisely. Output JSON only. Focus on concrete benefits, not generic travel advice. 10-15 words per reason.'
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
      refinementPrompt = `Make this budget-friendly. Replace with free/affordable options:
- Swap paid attractions with free parks, markets, walking tours
- Change restaurants to street food, local cafes, affordable spots
- Keep the time block structure (Morning/Afternoon/Evening)
- Be specific: mention actual free attractions or cheap eats
- ${parsed.numberOfDays} days, ${parsed.destinationCity}`;
    } else if (refinementType === 'relaxed') {
      refinementPrompt = `Make this more relaxed. Cut activities, add breathing room:
- Reduce to 1-2 activities per time block (not 3+)
- Add rest time, cafe stops, slow exploration
- Replace intense activities with calm ones (museums → parks, tours → walks)
- Keep time block structure but with less packed content
- ${parsed.numberOfDays} days, ${parsed.destinationCity}`;
    } else if (refinementType === 'add-day') {
      refinementPrompt = `Add one extra day. Insert it BEFORE the last day:
- Current: ${parsed.numberOfDays} days → New: ${parsed.numberOfDays + 1} days
- New day should have 1 major sight + local exploration
- Keep time block structure: Morning/Afternoon/Evening
- Last day stays as departure day
- ${parsed.destinationCity}`;
    } else {
      console.warn('[AI Service] Unknown refinement type:', refinementType);
      return null;
    }

    const currentItinerary = JSON.stringify(itinerary.plan, null, 2);

    const prompt = `Refine this itinerary:

Current:
${currentItinerary}

Change:
${refinementPrompt}

Rules:
- Keep destination: ${parsed.destinationCity}
- Maintain time block format in "plan": "Morning: ... Afternoon: ... Evening: ..."
- Keep same day count unless adding a day
- Be specific with place names and activities
- JSON only, no markdown

{
  "itinerary": [
    {
      "day": 1,
      "title": "Brief day theme",
      "plan": "Morning: [activity]. Afternoon: [activity], [food]. Evening: [activity]."
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You refine travel itineraries. Keep destination unchanged. Maintain time-block structure. Output JSON only. Be specific with places and activities.'
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

/**
 * Generate flight recommendations based on trip details.
 * @param {Object} tripData - Trip details
 * @returns {Promise<string|null>} Flight recommendation or null
 */
async function getFlightRecommendation(tripData) {
  try {
    const { sourceCity, destinationCity, numberOfDays, travelType } = tripData;
    
    if (!destinationCity) {
      console.warn('[AI Service] Insufficient data for flight recommendation');
      return null;
    }

    const prompt = `Flight advice for ${sourceCity ? sourceCity + ' → ' : ''}${destinationCity}, ${numberOfDays} days.

Give 3 elements in one sentence:
1. Best time to fly (morning/afternoon/evening) + reason
2. Direct or connecting + why
3. Practical tip (booking window, price, or logistics)

Format: "[Time] [type] flights work best because [reason]. [Tip]."

Example: "Morning direct flights let you start exploring same-day. Book 6-8 weeks out for lowest fares."

Be route-specific. One sentence only, plain text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: 'You give flight advice. One sentence. Be specific to the route. Include timing, type, and booking tip.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    return content?.trim() || null;

  } catch (error) {
    console.warn('[AI Service] Error getting flight recommendation:', error.message);
    return null;
  }
}

/**
 * Generate hotel recommendations with actual hotel names.
 * @param {Object} tripData - Trip details
 * @returns {Promise<Array<Object>|null>} Array of hotel recommendations or null
 */
async function getHotelRecommendations(tripData) {
  try {
    const { destinationCity, numberOfDays, travelType, budget } = tripData;
    
    if (!destinationCity) {
      console.warn('[AI Service] Insufficient data for hotel recommendations');
      return null;
    }

    const budgetNote = budget === 'luxury' ? '5-star luxury hotels' : 
                       budget === 'mid-range' ? 'good 3-4 star mid-range hotels' : 
                       budget === 'budget' ? 'budget-friendly hotels' : 'popular hotels';
    
    const prompt = `List 3-4 hotels in ${destinationCity} for ${numberOfDays} days, ${travelType || 'travel'}, ${budgetNote}.

Each hotel needs:
- name: Real hotel (use actual names if known)
- area: Exact neighborhood
- type: One-word style (Boutique/Luxury/Contemporary/Heritage/Business)
- highlight: Specific feature ("10min walk to [landmark]", "rooftop bar", "near [area] markets")

Be concrete. Mention real neighborhoods and nearby attractions.

JSON only:
{
  "hotels": [
    {
      "name": "Real Hotel Name",
      "area": "Neighborhood Name",
      "type": "Category",
      "highlight": "Specific nearby feature or benefit"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: 'You recommend hotels. Use real hotel names and neighborhoods. Be specific with highlights (nearby landmarks, features). JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[AI Service] No content for hotel recommendations');
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse hotel recommendations');
      return null;
    }

    // Validate structure
    if (!parsed.hotels || !Array.isArray(parsed.hotels)) {
      console.warn('[AI Service] Invalid hotel recommendations structure');
      return null;
    }

    return parsed.hotels;

  } catch (error) {
    console.warn('[AI Service] Error getting hotel recommendations:', error.message);
    return null;
  }
}

/**
 * Generate hotel recommendations based on trip details.
 * @param {Object} tripData - Trip details
 * @returns {Promise<string|null>} Hotel recommendation or null
 */
async function getHotelRecommendation(tripData) {
  try {
    const { destinationCity, numberOfDays, travelType, budget } = tripData;
    
    if (!destinationCity) {
      console.warn('[AI Service] Insufficient data for hotel recommendation');
      return null;
    }

    const budgetNote = budget ? ` (${budget} budget)` : '';
    const typeNote = travelType === 'family' ? ' with family-friendly amenities' : 
                     travelType === 'couple' ? ' with romantic atmosphere' : '';

    const prompt = `Where to stay in ${destinationCity} for ${numberOfDays} days, ${travelType || 'travel'}${budgetNote}?

One sentence with:
- Specific neighborhood name
- 2 concrete reasons ("near [landmark]", "metro access", "food scene", "walkable to [area]")

Format: "Stay in [Neighborhood] for [reason 1] and [reason 2]."

Example: "Stay in Trastevere for authentic trattorias and 15-minute walks to major sites."

Be specific to this city. Plain text, one sentence.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: 'You recommend where to stay. One sentence. Name specific neighborhood and 2 concrete reasons.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    return content?.trim() || null;

  } catch (error) {
    console.warn('[AI Service] Error getting hotel recommendation:', error.message);
    return null;
  }
}

/**
 * Get restaurant recommendations based on location and preferences.
 * @param {Object} params - Search parameters
 * @returns {Promise<Object|null>} Restaurant recommendations or null
 */
async function getRestaurantRecommendations({ city, area, radiusKm, preferences = {} }) {
  try {
    if (!city) {
      console.warn('[AI Service] City required for restaurant recommendations');
      return null;
    }

    const { dietType, cuisineType, timeOfDay, budget } = preferences;

    const dietNote = dietType === 'veg' ? 'vegetarian-friendly' : 
                     dietType === 'non-veg' ? 'non-vegetarian' : 'any';
    const cuisineNote = cuisineType && cuisineType !== 'all' ? `, ${cuisineType} cuisine` : '';
    const timeNote = timeOfDay && timeOfDay !== 'all' ? ` best for ${timeOfDay}` : '';
    const budgetNote = budget && budget !== 'all' ? ` in ${budget} range` : '';
    const locationNote = area ? ` in ${area}` : '';
    const radiusNote = radiusKm ? ` within ${radiusKm}km` : '';

    const prompt = `Find 6-8 iconic local restaurants in ${city}${locationNote}${radiusNote}.

Filters: ${dietNote}${cuisineNote}${timeNote}${budgetNote}

For each restaurant:
- name: Actual restaurant name (real, well-known spots)
- distanceKm: Estimated distance from ${area || 'city center'} (number only, e.g., 2.5)
- famousFor: One sentence why locals love it (specific reason, not generic)
- mustTry: Array of 1-3 specific dish names (not categories like "pasta" but "Cacio e Pepe")
- bestTime: Best time to visit (e.g., "Lunch", "Dinner", "Breakfast", "Evening snacks")
- category: One word (Street Food/Fine Dining/Casual/Cafe/Bar/Traditional)
- budget: ₹ or ₹₹ or ₹₹₹

Focus on:
- Places famous for specific dishes
- Local favorites, not tourist traps
- Real restaurant names
- Concrete dish names

JSON only:
{
  "city": "${city}",
  "area": "${area || 'city center'}",
  "restaurants": [
    {
      "name": "Restaurant Name",
      "distanceKm": 2.5,
      "famousFor": "Specific reason locals go here",
      "mustTry": ["Specific Dish 1", "Specific Dish 2"],
      "bestTime": "Lunch",
      "category": "Street Food",
      "budget": "₹"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { 
          role: 'system', 
          content: 'You recommend local restaurants. Use real names and specific dishes. Focus on iconic local food. JSON only.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[AI Service] No content for restaurant recommendations');
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.warn('[AI Service] Failed to parse restaurant recommendations');
      return null;
    }

    // Validate structure
    if (!parsed.restaurants || !Array.isArray(parsed.restaurants)) {
      console.warn('[AI Service] Invalid restaurant structure');
      return null;
    }

    return parsed;

  } catch (error) {
    console.warn('[AI Service] Error getting restaurant recommendations:', error.message);
    return null;
  }
}

export { 
  generateAIItinerary, 
  explainTripPlanWithAI, 
  refineItineraryWithAI, 
  getFlightRecommendation, 
  getHotelRecommendation, 
  getHotelRecommendations,
  getRestaurantRecommendations
};
