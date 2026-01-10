// Simple itinerary generator stub
// Generates a basic itinerary object from parsed trip info

/**
 * Generates a basic itinerary based on parsed trip info.
 * @param {{ sourceCity: string|null, destinationCity: string|null, numberOfDays: number|null, travelType: string }} parsedTrip
 * @returns {object} Itinerary object with days and activities
 */
function generateItinerary(parsedTrip) {
  const days = parsedTrip.numberOfDays || 3;
  const travelType = parsedTrip.travelType;
  
  // Define purposeful activities that vary by day
  const exploreActivities = [
    'Explore iconic landmarks and local neighborhoods',
    'Discover hidden gems and cultural hotspots',
    'Wander through markets and taste authentic cuisine',
    'Experience adventure activities and outdoor spots',
    'Visit museums, galleries, and heritage sites'
  ];
  
  const relaxActivities = [
    'Unwind at scenic viewpoints and cafes',
    'Enjoy leisurely walks and spa time',
    'Savor sunset views and fine dining',
    'Relax by the beach or pool'
  ];
  
  const itinerary = [];
  
  for (let i = 1; i <= days; i++) {
    let activity = '';
    let purpose = '';
    
    if (i === 1) {
      // First day: always arrival and settling in
      purpose = 'travel';
      activity = travelType === 'family' 
        ? 'Arrive, check in, and settle with the family'
        : travelType === 'couple'
        ? 'Arrive, check in, and enjoy a romantic evening'
        : travelType === 'solo'
        ? 'Arrive, check in, and take an evening stroll'
        : 'Arrive, check in, and explore nearby';
        
    } else if (i === days) {
      // Last day: always wrap up and departure
      purpose = 'travel';
      activity = 'Morning at leisure, pack up, and head home';
      
    } else {
      // Middle days: alternate between explore and relax with variety
      const middleDay = i - 1;
      const totalMiddleDays = days - 2;
      
      if (totalMiddleDays === 1) {
        // Only one middle day: focus on exploring
        purpose = 'explore';
        activity = exploreActivities[0];
      } else if (middleDay <= Math.ceil(totalMiddleDays * 0.7)) {
        // First 70% of middle days: explore
        purpose = 'explore';
        activity = exploreActivities[(middleDay - 1) % exploreActivities.length];
      } else {
        // Last 30% of middle days: relax
        purpose = 'relax';
        const relaxIndex = (middleDay - Math.ceil(totalMiddleDays * 0.7) - 1) % relaxActivities.length;
        activity = relaxActivities[relaxIndex];
      }
    }
    
    itinerary.push({
      day: i,
      activity,
      purpose
    });
  }
  
  return {
    source: parsedTrip.sourceCity || 'your city',
    destination: parsedTrip.destinationCity || 'destination',
    days,
    travelType: parsedTrip.travelType,
    plan: itinerary
  };
}


/**
 * Generates a simple, generic itinerary array based on days and travel type.
 * @param {number} numberOfDays
 * @param {'family'|'solo'|'couple'|'unknown'} travelType
 * @returns {Array<{ day: number, plan: string }>}
 */
function generateItinerarySimple(numberOfDays, travelType) {
  const plans = [];
  const type = travelType || 'unknown';
  for (let i = 1; i <= (numberOfDays || 1); i++) {
    let plan = '';
    if (i === 1) {
      plan = type === 'family' ? 'Arrival, rest, and family bonding' :
             type === 'couple' ? 'Arrival and relax together' :
             type === 'solo' ? 'Arrival and chill solo' :
             'Arrival and rest';
    } else if (i === (numberOfDays || 1)) {
      plan = type === 'family' ? 'Pack up, family breakfast, and return' :
             type === 'couple' ? 'Leisure morning and return' :
             type === 'solo' ? 'Explore, relax, and return' :
             'Explore and return';
    } else {
      plan = type === 'family' ? 'Family sightseeing and fun' :
             type === 'couple' ? 'Explore and enjoy together' :
             type === 'solo' ? 'Solo exploring and relaxing' :
             'Sightseeing and relaxing';
    }
    plans.push({ day: i, plan });
  }
  return plans;
}

export { generateItinerary, generateItinerarySimple };