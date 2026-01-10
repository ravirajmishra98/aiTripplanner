// Simple flight recommender stub
// Returns mock flight options based on source and destination

/**
 * Returns mock flight recommendations based on source and destination.
 * @param {string|null} sourceCity
 * @param {string|null} destinationCity
 * @returns {Array<{ airline: string, from: string, to: string, price: string, duration: string }>}
 */
function recommendFlights(sourceCity, destinationCity) {
  if (!sourceCity || !destinationCity) return [];
  // Mock data
  return [
    {
      airline: 'IndiGo',
      from: sourceCity,
      to: destinationCity,
      price: '₹4500',
      duration: '2h 15m'
    },
    {
      airline: 'Air India',
      from: sourceCity,
      to: destinationCity,
      price: '₹5200',
      duration: '2h 10m'
    },
    {
      airline: 'Vistara',
      from: sourceCity,
      to: destinationCity,
      price: '₹4800',
      duration: '2h 20m'
    }
  ];
}


/**
 * Recommends a flight option based on travel type.
 * @param {'family'|'solo'|'couple'|'unknown'} travelType
 * @returns {{ timing: string, type: string, explanation: string }}
 */
function recommendFlight(travelType) {
  let timing = 'morning';
  let type = 'direct';
  let explanation = '';
  if (travelType === 'family') {
    timing = 'morning';
    type = 'direct';
    explanation = 'Family ke saath travel hai, toh morning ka direct flight best rahega.';
  } else if (travelType === 'couple') {
    timing = 'evening';
    type = 'direct';
    explanation = 'Couple ke liye evening ka direct flight romantic hoga.';
  } else if (travelType === 'solo') {
    timing = 'morning';
    type = 'one-stop';
    explanation = 'Solo trip hai, toh morning ka one-stop flight bhi sahi hai.';
  } else {
    timing = 'morning';
    type = 'direct';
    explanation = 'Morning ka direct flight convenient rahega.';
  }
  return { timing, type, explanation };
}

export { recommendFlights, recommendFlight };