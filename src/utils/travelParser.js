// Utility to parse free-text travel input into structured info
// No external libraries used

/**
 * Parses free-text travel input and extracts structured info.
 * @param {string} inputText
 * @returns {{ sourceCity: string|null, destinationCity: string|null, numberOfDays: number|null, travelType: 'family'|'solo'|'couple'|'unknown' }}
 */
function parseTravelInput(inputText) {
  if (!inputText || typeof inputText !== 'string') {
    return {
      sourceCity: null,
      destinationCity: null,
      numberOfDays: null,
      travelType: 'unknown',
    };
  }
  const text = inputText.toLowerCase();

  // Extract cities - prioritize "From X to Y" pattern
  let sourceCity = null, destinationCity = null;
  
  // Try "From X to Y" first (most explicit pattern) - capture complete city names
  let cityMatch = text.match(/from\s+([a-z]+(?:\s+[a-z]+)?)\s+to\s+([a-z]+(?:\s+[a-z]+)?)/i);
  
  // If not found, try to find just source city: "From X"
  if (!cityMatch) {
    const sourceMatch = text.match(/from\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (sourceMatch) {
      sourceCity = sourceMatch[1].trim();
    }
  } else {
    sourceCity = cityMatch[1].trim();
    destinationCity = cityMatch[2].trim();
  }
  
  // If we still don't have destination, try to find it from "to Y" or "trip to Y"
  if (!destinationCity) {
    const destMatch = text.match(/(?:to|trip to|travel to)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (destMatch) {
      destinationCity = destMatch[1].trim();
    }
  }

  // Extract number of days (5 days, 3-day, 7 din, etc)
  let numberOfDays = null;
  let daysMatch = text.match(/(\d+)[\s\-]*(days?|din)/i);
  if (daysMatch) {
    numberOfDays = parseInt(daysMatch[1], 10);
  }

  // Determine travel type
  let travelType = 'unknown';
  if (/parents|family|kids|children|saath|with family|with parents|bacche|bachchon|maa|papa/.test(text)) {
    travelType = 'family';
  } else if (/solo|alone|by myself|akela|akeli/.test(text)) {
    travelType = 'solo';
  } else if (/couple|partner|wife|husband|girlfriend|boyfriend|saathi|patni|pati/.test(text)) {
    travelType = 'couple';
  }

  return {
    sourceCity: sourceCity || null,
    destinationCity: destinationCity || null,
    numberOfDays: numberOfDays || null,
    travelType,
  };
}

export { parseTravelInput };