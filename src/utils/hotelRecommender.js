// Simple hotel recommender stub
// Returns mock hotel options based on destination and travel type

/**
 * Returns mock hotel recommendations based on destination and travel type.
 * @param {string|null} destinationCity
 * @param {'family'|'solo'|'couple'|'unknown'} travelType
 * @returns {Array<{ name: string, type: string, location: string, note: string }>}
 */
function recommendHotels(destinationCity, travelType) {
  if (!destinationCity) return [];
  const city = destinationCity;
  if (travelType === 'family') {
    return [
      { name: 'Family Comfort Inn', type: 'Hotel', location: city, note: 'Family rooms available' },
      { name: 'Kids Friendly Resort', type: 'Resort', location: city, note: 'Play area for kids' }
    ];
  } else if (travelType === 'couple') {
    return [
      { name: 'Romantic Retreat', type: 'Hotel', location: city, note: 'Couple packages available' },
      { name: 'Lovers Paradise', type: 'Resort', location: city, note: 'Private suites' }
    ];
  } else if (travelType === 'solo') {
    return [
      { name: 'Solo Stay', type: 'Hostel', location: city, note: 'Meet other travelers' },
      { name: 'Budget Inn', type: 'Hotel', location: city, note: 'Affordable and safe' }
    ];
  } else {
    return [
      { name: 'City Center Hotel', type: 'Hotel', location: city, note: 'Good location' },
      { name: 'Standard Guesthouse', type: 'Guesthouse', location: city, note: 'Simple and clean' }
    ];
  }
}


/**
 * Recommends a hotel area based on travel type and number of days.
 * @param {'family'|'solo'|'couple'|'unknown'} travelType
 * @param {number|null} numberOfDays
 * @returns {{ area: string, reason: string }}
 */
function recommendHotelArea(travelType, numberOfDays) {
  let area = 'city center';
  let reason = '';
  if (travelType === 'family') {
    area = 'near main attractions';
    reason = 'Family ke saath ho toh sab jagah aasani se ja sakte ho.';
  } else if (travelType === 'couple') {
    area = 'quiet or scenic area';
    reason = 'Couple trip hai, toh shanti aur privacy milegi.';
  } else if (travelType === 'solo') {
    area = 'central or lively area';
    reason = 'Solo ho toh safe aur happening jagah pe raho.';
  } else {
    area = 'city center';
    reason = 'Yahan se sab kuch aasaan hai.';
  }
  // If stay is long, suggest peaceful area
  if (numberOfDays && numberOfDays > 5) {
    area = 'peaceful residential area';
    reason = 'Lamba stay hai toh shanti zaroori hai.';
  }
  return { area, reason };
}

export { recommendHotels, recommendHotelArea };