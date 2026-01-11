import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTripPlan } from '../utils/tripPlanner';
import { generateAIItinerary, explainTripPlanWithAI, getFlightRecommendation, getHotelRecommendation, getHotelRecommendations } from '../services/aiService';
import { getImageUrl } from '../services/imageService';

function TripPlanPage({ 
  isDesktop, 
  lastPlan, 
  setLastPlan,
  tripContext, 
  setTripContext,
  setShowAssistant
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const generationInProgressRef = useRef(false);
  const [expandedDay, setExpandedDay] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [flightRec, setFlightRec] = useState(null);
  const [hotelRec, setHotelRec] = useState(null);
  const [hotelsList, setHotelsList] = useState(null);
  const [heroImage, setHeroImage] = useState(null);
  const [fallbackHeroUrl, setFallbackHeroUrl] = useState(null);
  const [preferredTransport, setPreferredTransport] = useState('flight');
  const [availableTransports, setAvailableTransports] = useState(['flight']);

  // Indian cities list for domestic vs international detection
  const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 
    'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Goa', 'Kerala',
    'Shimla', 'Manali', 'Udaipur', 'Varanasi', 'Rishikesh', 'Ooty', 'Coorg',
    'Agra', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
    'Uttarakhand', 'Himachal Pradesh', 'Delhi NCR', 'Guwahati', 'Kochi'
  ];

  // Determine available transport modes based on source and destination
  const getAvailableTransports = (src, dest) => {
    const isSrcIndia = !src || INDIAN_CITIES.some(city => src.toLowerCase().includes(city.toLowerCase()));
    const isDestIndia = INDIAN_CITIES.some(city => dest.toLowerCase().includes(city.toLowerCase()));
    
    if (isSrcIndia && isDestIndia) {
      return ['flight', 'train', 'bus'];
    }
    return ['flight'];
  };

  // Random city hero fallback on mount
  useEffect(() => {
    const randomCities = ['Goa', 'Kerala', 'Jaipur', 'Manali', 'Udaipur', 'Rishikesh', 'Shimla', 'Ooty', 'Coorg', 'Varanasi'];
    const randomCity = randomCities[Math.floor(Math.random() * randomCities.length)];
    getImageUrl({ category: 'destination', cityName: randomCity }).then(url => setFallbackHeroUrl(url)).catch(() => {});
  }, []);

  // Handle incoming router state
  useEffect(() => {
    if (location.state?.source === 'trip-idea') {
      const { tripPlan, tripContext: incomingContext } = location.state;
      if (tripPlan && incomingContext) {
        setLastPlan(tripPlan);
        setTripContext(incomingContext);
        setShowAssistant(false);
        window.history.replaceState({}, document.title);
      }
    } else if (location.state?.source === 'explore') {
      const { destination, numberOfDays, travelType, intents } = location.state;
      if (destination && numberOfDays) {
        const plan = {
          parsed: {
            sourceCity: '',
            destinationCity: destination,
            numberOfDays: numberOfDays,
            travelType: travelType || 'leisure',
            intents: intents || []
          },
          itinerary: {
            plan: Array.from({ length: numberOfDays }, (_, i) => ({
              day: i + 1,
              activity: `Day ${i + 1} in ${destination}`,
              purpose: i === 0 ? 'travel' : i === numberOfDays - 1 ? 'travel' : 'explore'
            }))
          }
        };
        
        setLastPlan(plan);
        setTripContext({ from: '', to: destination, days: numberOfDays, pace: travelType || 'leisure' });
        setShowAssistant(false);
        window.history.replaceState({}, document.title);
      }
    } else if (location.state?.source === 'home-form') {
      const { sourceCity, destination, numberOfDays, budget, tripType } = location.state;
      if (destination && numberOfDays) {
        const plan = {
          parsed: {
            sourceCity: sourceCity || '',
            destinationCity: destination,
            numberOfDays: numberOfDays,
            travelType: tripType || 'solo',
            budget: budget || 'mid-range'
          },
          itinerary: {
            plan: Array.from({ length: numberOfDays }, (_, i) => ({
              day: i + 1,
              activity: `Day ${i + 1} in ${destination}`,
              purpose: 'explore'
            }))
          }
        };
        
        setLastPlan(plan);
        setTripContext({ from: sourceCity || '', to: destination, days: numberOfDays, pace: tripType || 'solo' });
        setShowAssistant(false);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  // Calculate available transports and set preferred option
  useEffect(() => {
    if (lastPlan && lastPlan.parsed) {
      const src = lastPlan.parsed.sourceCity || '';
      const dest = lastPlan.parsed.destinationCity || '';
      const available = getAvailableTransports(src, dest);
      setAvailableTransports(available);
      
      // Reset to first available option if current preference isn't available
      if (!available.includes(preferredTransport)) {
        setPreferredTransport(available[0]);
      }
    }
  }, [lastPlan]);

  // Generate AI itinerary
  useEffect(() => {
    if (lastPlan && lastPlan.parsed && !generationInProgressRef.current) {
      const planId = JSON.stringify(lastPlan.parsed);
      
      if (!lastPlan.itinerary?.plan?.[0]?.activity?.includes('Morning:') && 
          !generationInProgressRef.current) {
        generationInProgressRef.current = true;
        setAiLoading(true);

        generateAIItinerary({
          sourceCity: lastPlan.parsed.sourceCity || '',
          destinationCity: lastPlan.parsed.destinationCity,
          numberOfDays: lastPlan.parsed.numberOfDays,
          travelType: lastPlan.parsed.travelType || 'leisure',
          additionalContext: `\n- Budget: ${lastPlan.parsed.budget || 'flexible'}\n- Interests: ${(lastPlan.parsed.intents || []).join(', ') || 'general sightseeing'}`
        }).then(result => {
          if (result && result.itinerary) {
            const updatedPlan = {
              ...lastPlan,
              itinerary: {
                plan: result.itinerary.map(day => ({
                  day: day.day,
                  activity: `${day.title}\n\n${day.plan}`,
                  purpose: day.purpose || 'explore'
                }))
              }
            };
            setLastPlan(updatedPlan);

            // Get AI explanation with full trip plan object
            return explainTripPlanWithAI(updatedPlan).then(explanation => {
              if (explanation && Array.isArray(explanation)) {
                setAiExplanation(explanation.slice(0, 3));
              }
              // Fetch flight, hotel recommendations, and hotel list
              return Promise.all([
                getFlightRecommendation(lastPlan.parsed),
                getHotelRecommendation(lastPlan.parsed),
                getHotelRecommendations(lastPlan.parsed)
              ]);
            });
          }
        }).then(recommendations => {
          if (recommendations && Array.isArray(recommendations)) {
            setFlightRec(recommendations[0]);
            setHotelRec(recommendations[1]);
            setHotelsList(recommendations[2]);
          }
        }).catch(err => {
          console.error('AI generation error:', err);
        }).finally(() => {
          setAiLoading(false);
          generationInProgressRef.current = false;
        });
      }
    }
  }, [lastPlan]);

  const handleSaveTrip = () => {
    if (!lastPlan || aiLoading) return;
    
    const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const tripToSave = {
      id: Date.now(),
      plan: lastPlan,
      context: tripContext,
      savedAt: new Date().toISOString()
    };
    
    savedTrips.push(tripToSave);
    localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDayClick = (dayNumber) => {
    setExpandedDay(expandedDay === dayNumber ? null : dayNumber);
  };

  // Load destination hero image (runs whenever destination changes)
  useEffect(() => {
    if (!lastPlan?.parsed?.destinationCity) return;
    const loadHero = async () => {
      const url = await getImageUrl({ cityName: lastPlan.parsed.destinationCity, countryName: '', category: 'destination' });
      setHeroImage(url);
    };
    loadHero();
  }, [lastPlan?.parsed?.destinationCity]);

  if (!lastPlan || !lastPlan.parsed) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: 15
      }}>
        No trip plan available. Please create a trip from the home page.
      </div>
    );
  }

  const { parsed, itinerary } = lastPlan;
  const days = itinerary?.plan || [];

  // Debug: Log the data structure
  if (days.length > 0) {
    console.log('Days data:', days.map(d => ({ day: d.day, activityLength: d.activity?.length || 0, preview: d.activity?.substring(0, 100) })));
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      background: 'var(--app-bg)'
    }}>
      {/* Loading Overlay */}
      {aiLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          gap: 20
        }}>
          <div style={{
            fontSize: 48,
            animation: 'spin 2s linear infinite'
          }}>✈️</div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            color: '#0f172a',
            fontSize: 18,
            fontWeight: 600
          }}>Creating your itinerary...</div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        padding: isDesktop ? '48px 24px' : '32px 16px'
      }}>
        {/* Hero */}
        <div style={{
          width: '100%',
          height: isDesktop ? 240 : 180,
          borderRadius: 16,
          marginBottom: 28,
          overflow: 'hidden',
          position: 'relative',
          background: heroImage
            ? `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%), url(${heroImage}) center/cover`
            : fallbackHeroUrl
            ? `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%), url(${fallbackHeroUrl}) center/cover`
            : 'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 100%)'
        }}>
          <div style={{
            position: 'absolute',
            bottom: 14,
            left: 18,
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#ffffff',
            padding: '10px 14px',
            borderRadius: 10,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            fontSize: isDesktop ? 16 : 14,
            fontWeight: 700
          }}>
            <span>📍 {parsed.destinationCity}</span>
            <span style={{
              fontSize: 12,
              color: '#e2e8f0',
              fontWeight: 600
            }}>{parsed.numberOfDays} days · {parsed.travelType || 'Leisure'}</span>
          </div>
        </div>
        {/* 1. TRIP SNAPSHOT */}
        <div style={{
          marginBottom: 48
        }}>
          {/* Header with Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
            gap: 20
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: isDesktop ? 36 : 28,
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 12,
                lineHeight: 1.3,
                letterSpacing: '-0.02em'
              }}>
                {parsed.destinationCity}
              </h1>
              <div style={{
                display: 'flex',
                gap: 20,
                flexWrap: 'wrap',
                color: '#64748b',
                fontSize: 15,
                lineHeight: 1.6
              }}>
                <div>{parsed.numberOfDays} days</div>
                <div>{parsed.travelType || 'Solo'}</div>
                {parsed.budget && <div>{parsed.budget}</div>}
              </div>
            </div>
            
            {/* Action Buttons - Top Right */}
            <div style={{
              display: 'flex',
              gap: 12,
              flexShrink: 0
            }}>
              <button
                onClick={handleSaveTrip}
                disabled={aiLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  background: saveSuccess ? '#10b981' : '#0f172a',
                  border: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiLoading ? 0.5 : 1,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!saveSuccess && !aiLoading) e.target.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  if (!saveSuccess && !aiLoading) e.target.style.opacity = '1';
                }}
              >
                {saveSuccess ? 'Saved' : 'Save Trip'}
              </button>
              <button
                onClick={() => setShowAssistant(true)}
                disabled={aiLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: aiLoading ? 0.5 : 1,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!aiLoading) e.target.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  if (!aiLoading) e.target.style.borderColor = '#cbd5e1';
                }}
              >
                Edit Plan
              </button>
            </div>
          </div>

          {/* Trip Rhythm Bar - Visual Summary */}
          {lastPlan && lastPlan.itinerary && lastPlan.itinerary.plan && lastPlan.itinerary.plan.length > 0 && (
            <div style={{
              marginBottom: 48,
              paddingBottom: 32,
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#64748b',
                marginBottom: 16
              }}>
                Trip Rhythm
              </h3>
              <div style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {lastPlan.itinerary.plan.map((dayData, idx) => {
                  // Detect theme for each day
                  const activities = dayData.activity.split('\n\n');
                  const title = activities[0] || '';
                  const titleLower = title.toLowerCase();
                  
                  let theme = 'Explore';
                  if (titleLower.includes('arrival') || titleLower.includes('arrive')) theme = 'Arrival';
                  else if (titleLower.includes('departure') || titleLower.includes('depart')) theme = 'Departure';
                  else if (titleLower.includes('culture') || titleLower.includes('temple') || titleLower.includes('museum')) theme = 'Culture';
                  else if (titleLower.includes('relax') || titleLower.includes('beach') || titleLower.includes('spa')) theme = 'Relax';
                  else if (titleLower.includes('food') || titleLower.includes('culinary') || titleLower.includes('market')) theme = 'Food';
                  
                  const icons = {
                    'Arrival': '✈️',
                    'Departure': '🏠',
                    'Explore': '🗺️',
                    'Relax': '🌴',
                    'Culture': '🎭',
                    'Food': '🍽️'
                  };
                  const icon = icons[theme] || '🗺️';
                  
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <span style={{ 
                        fontSize: 13, 
                        fontWeight: 500,
                        color: '#0f172a'
                      }}>
                        Day {dayData.day}
                      </span>
                      <span style={{ 
                        fontSize: 11, 
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        {theme}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Why This Plan Works - Confidence Signals */}
          {aiExplanation && aiExplanation.length > 0 && (
            <div style={{
              marginBottom: 32,
              paddingBottom: 32,
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#64748b',
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Why this works
              </div>
              <div style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                {aiExplanation.map((reason, index) => {
                  // Extract confidence signal from text
                  let icon = '✓';
                  let label = reason;
                  
                  const text = reason.toLowerCase();
                  if (text.includes('time') || text.includes('rushing') || text.includes('pace') || text.includes('relaxed')) {
                    icon = '⏱️';
                    label = 'Not rushed';
                  } else if (text.includes('fresh') || text.includes('arrive') || text.includes('flight') || text.includes('morning')) {
                    icon = '☀️';
                    label = 'Fresh arrival';
                  } else if (text.includes('center') || text.includes('central') || text.includes('stay') || text.includes('location')) {
                    icon = '🏨';
                    label = 'Central stay';
                  } else if (text.includes('access') || text.includes('easy') || text.includes('convenient') || text.includes('walkable')) {
                    icon = '🧭';
                    label = 'Easy access';
                  } else if (text.includes('days') || text.includes('duration') || text.includes('enough')) {
                    icon = '📅';
                    label = 'Perfect duration';
                  } else if (text.includes('balance') || text.includes('mix')) {
                    icon = '⚖️';
                    label = 'Balanced days';
                  } else if (text.includes('direct') || text.includes('connection')) {
                    icon = '✈️';
                    label = 'Direct flights';
                  } else if (text.includes('price') || text.includes('rate') || text.includes('budget')) {
                    icon = '💰';
                    label = 'Good value';
                  } else {
                    // Generic extraction - take first 2-3 words
                    const words = reason.split(' ').slice(0, 3).join(' ');
                    label = words.length > 20 ? words.substring(0, 20) : words;
                  }
                  
                  return (
                    <div 
                      key={index} 
                      title={reason}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#475569',
                        cursor: 'help',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. FLIGHT & HOTEL DECISION CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: 24,
          marginBottom: 48,
          paddingBottom: 48,
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* Flight Decision Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 24,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ✈️ Best Flight for This Trip
            </div>
            
            {/* Flight Structured Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                // Parse flight recommendation into structured format
                const flightText = (flightRec || `Direct flights from ${parsed.sourceCity || 'your city'} to ${parsed.destinationCity}`).toLowerCase();
                
                let timing = 'Morning';
                let flightType = 'Direct';
                let benefit = 'Optimal timing';
                
                if (flightText.includes('morning') || flightText.includes('early')) timing = 'Morning';
                else if (flightText.includes('afternoon') || flightText.includes('midday')) timing = 'Afternoon';
                else if (flightText.includes('evening') || flightText.includes('late')) timing = 'Evening';
                
                if (flightText.includes('stop') || flightText.includes('connect')) flightType = '1 Stop';
                if (flightText.includes('direct') || flightText.includes('nonstop')) flightType = 'Direct';
                
                if (flightText.includes('relax') || flightText.includes('arrive fresh')) benefit = 'Arrive relaxed';
                else if (flightText.includes('rush') || flightText.includes('avoid')) benefit = 'Avoid rush';
                else if (flightText.includes('rest') || flightText.includes('sleep')) benefit = 'Time to rest';
                else if (flightText.includes('best') || flightText.includes('optimal')) benefit = 'Optimal timing';
                else if (flightText.includes('price') || flightText.includes('rate') || flightText.includes('cheap')) benefit = 'Best rates';
                
                return (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Timing</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{timing}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Type</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{flightType}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Benefit</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{benefit}</div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* Confidence Badges */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, padding: '6px 12px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 4, color: '#15803d' }}>✓ Time-optimized</div>
              <div style={{ fontSize: 11, padding: '6px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, color: '#d97706' }}>⚡ Good rates</div>
            </div>
          </div>

          {/* Hotel Decision Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 24,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              🏨 Stay Recommendation
            </div>
            
            {/* Hotel Structured Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {hotelsList && hotelsList.length > 0 ? (
                // Show AI-recommended hotels list
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Recommended Hotels</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {hotelsList.slice(0, 3).map((hotel, idx) => (
                      <div key={idx} style={{
                        padding: 10,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{hotel.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{hotel.area} • {hotel.type}</div>
                        <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>{hotel.highlight}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Fallback: Show parsed recommendation
                <>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Area</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {(() => {
                        const hotelText = (hotelRec || `Stay in central ${parsed.destinationCity}`).toLowerCase();
                        if (hotelText.includes('beach')) return 'Beach area';
                        else if (hotelText.includes('old city') || hotelText.includes('historic')) return 'Old City';
                        else if (hotelText.includes('market') || hotelText.includes('bazaar')) return 'Market District';
                        else if (hotelText.includes('riverside') || hotelText.includes('river')) return 'Riverside';
                        else if (hotelText.includes('downtown') || hotelText.includes('center')) return 'Downtown';
                        else return 'Central ' + parsed.destinationCity;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Why this works</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {(() => {
                        const hotelText = (hotelRec || '').toLowerCase();
                        if (hotelText.includes('easy') || hotelText.includes('convenient')) return 'Easy access';
                        else if (hotelText.includes('explore') || hotelText.includes('attraction')) return 'Near attractions';
                        else if (hotelText.includes('central')) return 'Central location';
                        else if (hotelText.includes('local') || hotelText.includes('authentic')) return 'Local experience';
                        else return 'Perfect location';
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Confidence Badges */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, color: '#374151' }}>📍 Central location</div>
              <div style={{ fontSize: 11, padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, color: '#374151' }}>✓ Verified</div>
            </div>
          </div>
        </div>

        {/* 3. ITINERARY */}
        <div style={{
          marginBottom: 48
        }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#64748b',
            marginBottom: 24,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Daily Plan
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
            gap: 16
          }}>
            {days.map((day, index) => {
              const isExpanded = expandedDay === day.day;
              const activityText = day.activity || '';
              const activities = activityText.split('\n').filter(line => line.trim());
              
              // Extract theme from title
              let theme = 'Explore';
              let dayTitle = activities[0] || `Day ${day.day}`;
              if (dayTitle.toLowerCase().includes('arrival')) theme = 'Arrival';
              else if (dayTitle.toLowerCase().includes('departure') || dayTitle.toLowerCase().includes('leisurely morning')) theme = 'Departure';
              else if (dayTitle.toLowerCase().includes('relax') || dayTitle.toLowerCase().includes('leisure')) theme = 'Relax';
              else if (dayTitle.toLowerCase().includes('culture') || dayTitle.toLowerCase().includes('local')) theme = 'Culture';
              else if (dayTitle.toLowerCase().includes('landmark') || dayTitle.toLowerCase().includes('iconic')) theme = 'Explore';
              else if (dayTitle.toLowerCase().includes('food') || dayTitle.toLowerCase().includes('market')) theme = 'Food';
              
              // Get icon based on theme
              const icons = {
                'Arrival': '✈️',
                'Departure': '🏠',
                'Explore': '🗺️',
                'Relax': '🌴',
                'Culture': '🎭',
                'Food': '🍽️'
              };
              const icon = icons[theme] || '🗺️';
              
              // Parse activity text into time blocks
              const detailLines = activities.slice(1);
              const fullText = detailLines.join(' ');
              
              // Helper: Truncate at word boundary, but show complete sentences if short
              const truncateAtWord = (text, maxLength = 200) => {
                if (!text || text.length <= maxLength) return text;
                const truncated = text.substring(0, maxLength);
                const lastSpace = truncated.lastIndexOf(' ');
                if (lastSpace > 50) { // Only truncate if we have substantial text
                  return truncated.substring(0, lastSpace).trim() + '...';
                }
                return truncated.trim() + '...';
              };
              
              // Smart parsing: extract meaningful action phrases
              let timeBlocks = [];
              
              // Method 1: Look for explicit time mentions - more flexible matching
              const morningMatch = fullText.match(/(?:morning|early|dawn)[:\s,]*([^.!?]*?)(?=\s*(?:afternoon|lunch|midday|then|and then|In the afternoon|later|evening|$))/i);
              const afternoonMatch = fullText.match(/(?:afternoon|lunch|midday)[:\s,]*([^.!?]*?)(?=\s*(?:evening|dinner|night|then|and then|In the evening|later|$))/i);
              const eveningMatch = fullText.match(/(?:evening|night|dinner|dusk)[:\s,]*([^.!?]*?)(?=\s*(?:\.|$))/i);
              
              if (morningMatch || afternoonMatch || eveningMatch) {
                if (morningMatch && morningMatch[1].trim().length > 0) {
                  const text = morningMatch[1].trim();
                  const cleaned = text.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 3);
                  const activity = cleaned.length > 0 ? truncateAtWord(cleaned.join(', ')) : 'Explore and enjoy';
                  timeBlocks.push({ 
                    time: 'Morning', 
                    activity: activity,
                    icon: '☀️' 
                  });
                }
                if (afternoonMatch && afternoonMatch[1].trim().length > 0) {
                  const text = afternoonMatch[1].trim();
                  const cleaned = text.split(/[;]/).map(s => s.trim()).filter(s => s.length > 3);
                  const activity = cleaned.length > 0 ? truncateAtWord(cleaned.join(', ')) : 'Explore and relax';
                  timeBlocks.push({ 
                    time: 'Afternoon', 
                    activity: activity,
                    icon: '🌤️' 
                  });
                }
                if (eveningMatch && eveningMatch[1].trim().length > 0) {
                  const text = eveningMatch[1].trim();
                  const cleaned = text.split(/[;]/).map(s => s.trim()).filter(s => s.length > 3);
                  const activity = cleaned.length > 0 ? truncateAtWord(cleaned.join(', ')) : 'Dinner and relax';
                  timeBlocks.push({ 
                    time: 'Evening', 
                    activity: activity,
                    icon: '🌙' 
                  });
                }
              } else {
                // Method 2: Split by sentences and distribute across time periods
                const sentences = fullText
                  .split(/[.!?]+/)
                  .map(s => s.trim())
                  .filter(s => s.length > 15);
                
                if (sentences.length >= 3) {
                  // Take key parts from each sentence
                  const extractKeyPhrase = (sentence) => {
                    // Remove common starting words
                    let cleaned = sentence
                      .replace(/^(Arrive in|Check into|Visit|Explore|Enjoy|Spend|Take|Relax at|Have|End|Start with|Begin)\s+/i, '')
                      .replace(/^(the|a|an|your|some)\s+/i, '');
                    
                    return truncateAtWord(cleaned.trim());
                  };
                  
                  timeBlocks = [
                    { time: 'Morning', activity: extractKeyPhrase(sentences[0]), icon: '☀️' },
                    { time: 'Afternoon', activity: extractKeyPhrase(sentences[Math.floor(sentences.length / 2)]), icon: '🌤️' },
                    { time: 'Evening', activity: extractKeyPhrase(sentences[sentences.length - 1]), icon: '🌙' }
                  ];
                } else if (sentences.length === 2) {
                  const extractKeyPhrase = (sentence) => {
                    let cleaned = sentence.replace(/^(Arrive in|Check into|Visit|Explore|Enjoy|Spend|Take|Relax at|Have|End|Start with|Begin)\s+/i, '');
                    return truncateAtWord(cleaned.trim());
                  };
                  
                  timeBlocks = [
                    { time: 'Morning', activity: extractKeyPhrase(sentences[0]), icon: '☀️' },
                    { time: 'Evening', activity: extractKeyPhrase(sentences[1]), icon: '🌙' }
                  ];
                } else if (sentences.length === 1) {
                  timeBlocks = [{ time: 'All Day', activity: truncateAtWord(sentences[0]), icon: '🗓️' }];
                }
              }
              
              // Filter out empty activities
              timeBlocks = timeBlocks.filter(block => block.activity && block.activity.length > 3);
              
              return (
                <div
                  key={day.day}
                  onClick={() => handleDayClick(day.day)}
                  style={{
                    background: '#ffffff',
                    border: isExpanded ? '2px solid #0f172a' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Day Number Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isExpanded ? '#0f172a' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: isExpanded ? '#ffffff' : '#64748b'
                  }}>
                    {day.day}
                  </div>

                  {/* Icon */}
                  <div style={{
                    fontSize: 32,
                    marginBottom: 12
                  }}>
                    {icon}
                  </div>

                  {/* Theme Label */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 16
                  }}>
                    {theme}
                  </div>

                  {/* Time-based Timeline */}
                  {timeBlocks.length > 0 && (
                    <div style={{
                      position: 'relative',
                      paddingLeft: 24
                    }}>
                      {/* Vertical line */}
                      <div style={{
                        position: 'absolute',
                        left: 8,
                        top: 8,
                        bottom: 8,
                        width: 2,
                        background: '#e2e8f0'
                      }} />
                      
                      {timeBlocks.map((block, i) => (
                        <div key={i} style={{
                          position: 'relative',
                          marginBottom: i < timeBlocks.length - 1 ? 16 : 0
                        }}>
                          {/* Dot on timeline */}
                          <div style={{
                            position: 'absolute',
                            left: -16,
                            top: 4,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#0f172a',
                            border: '2px solid #ffffff'
                          }} />
                          
                          <div style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span>{block.icon}</span>
                            <span>{block.time}</span>
                          </div>
                          <div style={{
                            fontSize: isExpanded ? 14 : 13,
                            color: '#475569',
                            lineHeight: 1.5
                          }}>
                            {block.activity}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Click hint */}
                  {!isExpanded && (
                    <div style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      marginTop: 16,
                      fontStyle: 'italic'
                    }}>
                      Click for full details
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. BOOKING SECTION */}
        <div style={{
          paddingTop: 48,
          borderTop: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#64748b',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Book Your Trip
          </h3>

          {/* Transport Mode Selection (only for domestic trips with multiple options) */}
          {availableTransports.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>
                Preferred Transport Mode
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableTransports.map(transport => (
                  <button
                    key={transport}
                    onClick={() => setPreferredTransport(transport)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: preferredTransport === transport ? '#1976d2' : '#e2e8f0',
                      border: `2px solid ${preferredTransport === transport ? '#1976d2' : '#cbd5e1'}`,
                      color: preferredTransport === transport ? '#fff' : '#0f172a',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {transport === 'flight' && '✈️ Flight'}
                    {transport === 'train' && '🚂 Train'}
                    {transport === 'bus' && '🚌 Bus'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Booking Actions */}
          <div style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            {availableTransports.includes('flight') && (
            <button
              onClick={() => {
                const dest = parsed.destinationCity || '';
                const src = parsed.sourceCity || '';
                const today = new Date();
                const start = today.toISOString().slice(0, 10);
                const flightUrl = src 
                  ? `https://www.google.com/search?q=flights+from+${encodeURIComponent(src)}+to+${encodeURIComponent(dest)}+${start}`
                  : `https://www.google.com/search?q=flights+to+${encodeURIComponent(dest)}+${start}`;
                window.open(flightUrl, '_blank');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: 6,
                background: preferredTransport === 'flight' ? '#1976d2' : '#0f172a',
                border: 'none',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: preferredTransport === 'flight' ? '0 2px 8px rgba(25,118,210,0.3)' : 'none'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              ✈️ Book Flight
            </button>
            )}
            {availableTransports.includes('train') && (
            <button
              onClick={() => {
                const dest = parsed.destinationCity || '';
                const src = parsed.sourceCity || '';
                const today = new Date();
                const start = today.toISOString().slice(0, 10);
                const trainUrl = src 
                  ? `https://www.google.com/search?q=trains+from+${encodeURIComponent(src)}+to+${encodeURIComponent(dest)}+${start}`
                  : `https://www.google.com/search?q=trains+to+${encodeURIComponent(dest)}+${start}`;
                window.open(trainUrl, '_blank');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: 6,
                background: preferredTransport === 'train' ? '#1976d2' : '#0f172a',
                border: 'none',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: preferredTransport === 'train' ? '0 2px 8px rgba(25,118,210,0.3)' : 'none'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              🚂 Book Train
            </button>
            )}
            {availableTransports.includes('bus') && (
            <button
              onClick={() => {
                const dest = parsed.destinationCity || '';
                const src = parsed.sourceCity || '';
                const today = new Date();
                const start = today.toISOString().slice(0, 10);
                const busUrl = src 
                  ? `https://www.google.com/search?q=buses+from+${encodeURIComponent(src)}+to+${encodeURIComponent(dest)}+${start}`
                  : `https://www.google.com/search?q=buses+to+${encodeURIComponent(dest)}+${start}`;
                window.open(busUrl, '_blank');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: 6,
                background: preferredTransport === 'bus' ? '#1976d2' : '#0f172a',
                border: 'none',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: preferredTransport === 'bus' ? '0 2px 8px rgba(25,118,210,0.3)' : 'none'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              🚌 Book Bus
            </button>
            )}
            <button
              onClick={() => {
                const dest = parsed.destinationCity || '';
                const days = parsed.numberOfDays || '';
                const today = new Date();
                const start = today.toISOString().slice(0, 10);
                let end = start;
                if (days && Number(days) > 0) {
                  const endDate = new Date(today);
                  endDate.setDate(today.getDate() + Number(days));
                  end = endDate.toISOString().slice(0, 10);
                }
                const hotelUrl = `https://www.google.com/search?q=hotels+in+${encodeURIComponent(dest)}+${start}+to+${end}`;
                window.open(hotelUrl, '_blank');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: 6,
                background: '#0f172a',
                border: 'none',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              🏨 Book Hotel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripPlanPage;
