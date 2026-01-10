// Trip planner utility: combines parsing, itinerary, flight, and hotel recommendations



import { parseTravelInput } from './travelParser';
import { getFollowUpQuestions } from './travelQuestions';
import { generateItinerary, generateItinerarySimple } from './itineraryGenerator';
import { recommendFlight } from './flightRecommender';
import { recommendHotelArea } from './hotelRecommender';

/**
 * Plans a trip from free-text input, returning all recommendations.
 * @param {string} inputText
 * @returns {object} Trip plan summary
 */

function planTrip(inputText) {
  const parsed = parseTravelInput(inputText);
  const itinerary = generateItinerary(parsed);
  const flight = recommendFlight(parsed.travelType);
  const hotelArea = recommendHotelArea(parsed.travelType, parsed.numberOfDays);
  return {
    parsed,
    itinerary,
    flight,
    hotelArea
  };
}


/**
 * Creates a trip plan or returns follow-up questions if info is missing.
 * @param {string} inputText
 * @param {string} language - 'english', 'hinglish', or 'hindi'
 * @returns {{ followUpQuestions?: string[], plan?: object }}
 */
function createTripPlan(inputText, language = 'english') {
  const parsed = parseTravelInput(inputText);
  const followUpQuestions = getFollowUpQuestions(parsed, language);
  if (followUpQuestions.length > 0) {
    return { followUpQuestions };
  }
  const itinerary = generateItinerary(parsed);
  const flight = recommendFlight(parsed.travelType);
  const hotelArea = recommendHotelArea(parsed.travelType, parsed.numberOfDays);
  return {
    plan: {
      parsed,
      itinerary,
      flight,
      hotelArea
    }
  };
}

export { planTrip, createTripPlan };