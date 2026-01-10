// Common travel-related questions for user guidance or chatbot flows

const travelQuestions = [
  "What is your source city?",
  "What is your destination city?",
  "How many days do you plan to travel?",
  "Who are you traveling with? (family, solo, couple, etc.)",
  "What is your preferred mode of transport?",
  "Do you have any specific interests or activities in mind?",
  "What is your approximate budget?"
];

/**
 * Returns up to 2 follow-up questions based on missing trip info and language preference.
 * @param {{ sourceCity: string|null, destinationCity: string|null, numberOfDays: number|null, travelType: string }} parsedTrip
 * @param {string} language - 'english', 'hinglish', or 'hindi'
 * @returns {string[]}
 */
function getFollowUpQuestions(parsedTrip, language = 'english') {
  const questions = {
    english: {
      source: 'Where are you traveling from? (Source city)',
      destination: 'Where do you want to go? (Destination city)',
      days: 'How many days will you travel for?'
    },
    hinglish: {
      source: 'Kahan se travel kar rahe ho? (Source city)',
      destination: 'Kahan jaana hai? (Destination city)',
      days: 'Kitne din ke liye travel karna hai?'
    },
    hindi: {
      source: 'आप कहाँ से यात्रा कर रहे हैं? (शहर)',
      destination: 'आप कहाँ जाना चाहते हैं? (शहर)',
      days: 'आप कितने दिनों के लिए यात्रा करेंगे?'
    }
  };

  const lang = questions[language] || questions.english;
  const qArray = [];

  // Only ask for required fields: source, destination, and days
  if (!parsedTrip.sourceCity) {
    qArray.push(lang.source);
  }
  if (!parsedTrip.destinationCity && qArray.length < 2) {
    qArray.push(lang.destination);
  }
  if (!parsedTrip.numberOfDays && qArray.length < 2) {
    qArray.push(lang.days);
  }

  // Only return max 2 questions
  return qArray.slice(0, 2);
}

export { travelQuestions, getFollowUpQuestions };