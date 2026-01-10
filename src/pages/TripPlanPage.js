import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTripPlan } from '../utils/tripPlanner';
import { generateAIItinerary, explainTripPlanWithAI, refineItineraryWithAI } from '../services/aiService';

function TripPlanPage({ 
  isDesktop, 
  lastPlan, 
  setLastPlan,
  tripContext, 
  setTripContext,
  messages,
  setMessages,
  setShowAssistant
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const generationInProgressRef = useRef(false);
  const initialPlanIdRef = useRef(null);
  const [openSection, setOpenSection] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [refinementLoading, setRefinementLoading] = useState(false);

  // Handle incoming router state from trip idea cards, explore destinations, and home form
  useEffect(() => {
    if (location.state?.source === 'trip-idea') {
      const { tripPlan, tripContext: incomingContext } = location.state;
      if (tripPlan && incomingContext) {
        setLastPlan(tripPlan);
        setTripContext(incomingContext);
        // Ensure assistant stays closed for trip-idea navigation
        setShowAssistant(false);
        // Clear the state to prevent re-initialization on navigation back
        window.history.replaceState({}, document.title);
      }
    } else if (location.state?.source === 'explore') {
      const { destination, numberOfDays, travelType, intents } = location.state;
      if (destination && numberOfDays) {
        // Create a trip plan from explore destination
        let intentsText = '';
        if (intents && intents.length > 0) {
          const intentLabels = {
            'weekend': '3-day weekend trip',
            'family': 'family-friendly',
            'budget': 'budget-conscious',
            'relaxed': 'relaxed and leisurely'
          };
          intentsText = ' - ' + intents.map(id => intentLabels[id] || id).join(', ');
        }
        
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
              activity: `Day ${i + 1} in ${destination}${intentsText}`,
              purpose: i === 0 ? 'travel' : i === numberOfDays - 1 ? 'travel' : i <= Math.ceil((numberOfDays - 2) * 0.7) ? 'explore' : 'relax'
            }))
          }
        };
        
        const context = {
          from: '',
          to: destination,
          days: numberOfDays,
          pace: travelType || 'leisure'
        };
        
        setLastPlan(plan);
        setTripContext(context);
        setShowAssistant(false);
        // Clear the state to prevent re-initialization on navigation back
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
              purpose: i === 0 ? 'travel' : i === numberOfDays - 1 ? 'travel' : i <= Math.ceil((numberOfDays - 2) * 0.7) ? 'explore' : 'relax'
            }))
          }
        };

        const context = {
          from: sourceCity || '',
          to: destination,
          days: numberOfDays,
          pace: tripType || 'solo'
        };

        setLastPlan(plan);
        setTripContext(context);
        setShowAssistant(false);
        window.history.replaceState({}, document.title);
      }
    }
  }, []);

  // Handle redirect delay - give state time to update from HomePage
  useEffect(() => {
    if (!lastPlan) {
      const timer = setTimeout(() => {
        if (!lastPlan) {
          navigate('/');
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [lastPlan, navigate]);

  // Generate AI itinerary when plan first loads
  useEffect(() => {
    const generateItinerary = async () => {
      // Prevent concurrent generation
      if (generationInProgressRef.current || !lastPlan) return;
      
      const { sourceCity, destinationCity, numberOfDays, travelType, intents, budget } = lastPlan.parsed || {};
      if (!destinationCity || !numberOfDays) return;

      // Create plan ID from destination + days + intents
      const planId = destinationCity + numberOfDays + (intents?.join('') || '');
      
      // Only generate if this is a NEW plan (not previously generated)
      if (initialPlanIdRef.current === planId) return;
      
      // Mark this plan as being processed
      generationInProgressRef.current = true;
      initialPlanIdRef.current = planId;
      setAiLoading(true);
      
      // Build additional context from intents
      let additionalContext = '';
      if (intents && intents.length > 0) {
        const intentDescriptions = {
          'weekend': 'Make it a quick 3-day weekend trip with the most iconic experiences',
          'family': 'Ensure it is family-friendly with kid-appropriate activities and accommodations',
          'budget': 'Keep the budget under 10k per person, focusing on affordable activities and local food',
          'relaxed': 'Make it a relaxed, leisurely trip with plenty of rest time and no rushed itineraries'
        };
        additionalContext = '\n\n' + intents.map(id => intentDescriptions[id]).filter(Boolean).join('\n');
      }
      // Budget context
      if (budget) {
        const budgetText = budget === 'budget'
          ? 'Make it budget-friendly: affordable stays, local transport, economical dining.'
          : budget === 'luxury'
          ? 'Make it a luxury experience: premium stays, fine dining, private transfers.'
          : 'Balance cost and comfort with well-rated stays and popular experiences.';
        additionalContext += `\n${budgetText}`;
      }
      // Friends trip nuance
      if (travelType === 'friends') {
        additionalContext += '\nPlan for a group of friends with shared fun experiences, nightlife options, and flexible scheduling.';
      }
      
      const aiResult = await generateAIItinerary({
        sourceCity: sourceCity || 'Your city',
        destinationCity,
        numberOfDays: parseInt(numberOfDays) || numberOfDays,
        travelType: travelType || 'leisure',
        additionalContext: additionalContext
      });

      let updatedPlan = lastPlan;
      
      if (aiResult && aiResult.itinerary) {
        // Successfully got AI itinerary - replace the static one
        updatedPlan = {
          ...lastPlan,
          itinerary: {
            ...lastPlan.itinerary,
            plan: aiResult.itinerary.map(day => ({
              day: day.day,
              activity: `${day.title}. ${day.plan}`,
              purpose: day.day === 1 ? 'travel' : 
                       day.day === numberOfDays ? 'travel' : 
                       day.day <= Math.ceil((numberOfDays - 2) * 0.7) + 1 ? 'explore' : 'relax'
            }))
          }
        };
        setLastPlan(updatedPlan);
      }
      // If AI fails, existing static itinerary remains (graceful fallback)
      
      // Generate AI explanation after itinerary is ready
      const explanation = await explainTripPlanWithAI(updatedPlan);
      if (explanation) {
        setAiExplanation(explanation);
      }
      
      setAiLoading(false);
      generationInProgressRef.current = false;
    };

    generateItinerary();
  }, [lastPlan]);

  // Save trip to localStorage
  const handleSaveTrip = () => {
    const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const newTrip = {
      id: Date.now(),
      tripContext,
      plan: lastPlan,
      savedAt: new Date().toISOString()
    };
    savedTrips.push(newTrip);
    localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Redirect to home if no plan exists (after delay)
  if (!lastPlan) {
    return null;
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      overflow: 'hidden',
      height: '100%',
      position: 'relative'
    }}>
      {/* AI Loading Overlay */}
      {aiLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(25, 118, 210, 0.2)',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 20
          }} />
          <div style={{
            color: '#0f172a',
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8
          }}>
            Creating a smart itinerary…
          </div>
          <div style={{
            color: '#475569',
            fontSize: 14
          }}>
            This will only take a moment
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Main content area (left on desktop, top on mobile) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%'
      }}>
        {/* Trip context bar */}
        {tripContext && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(25, 118, 210, 0.06)',
            borderBottom: '1px solid var(--border)',
            zIndex: 30,
            flexShrink: 0
          }}>
            <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 15 }}>
              {tripContext.from ? `${tripContext.from} → ${tripContext.to}` : tripContext.to}
            </div>
            <div style={{ color: '#1976d2' }}>|</div>
            <div style={{ color: '#0f172a', fontSize: 15 }}>{tripContext.days ? `${tripContext.days} days` : ''}</div>
            {tripContext.pace && (
              <>
                <div style={{ color: '#1976d2' }}>|</div>
                <div style={{ color: '#0f172a', fontSize: 15 }}>{tripContext.pace}</div>
              </>
            )}
          </div>
        )}

        {/* Why this plan works for you - AI-powered */}
        {lastPlan && aiExplanation && aiExplanation.length > 0 && (
          <div style={{
            padding: isDesktop ? '16px 24px' : '14px 16px',
            background: 'rgba(25, 118, 210, 0.06)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0
          }}>
            <div style={{
              color: '#1976d2',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 10,
              letterSpacing: '0.3px'
            }}>
              ✨ Why this plan works for you
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {aiExplanation.map((reason, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  color: '#0f172a',
                  fontSize: 13,
                  lineHeight: 1.5
                }}>
                  <span style={{ color: '#1976d2', flexShrink: 0 }}>•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trip Plan Content */}
      <div style={{
        padding: isDesktop ? '20px 24px' : '16px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flex: 1,
        minHeight: 0,
        zIndex: 25,
        animation: 'fadeInUp 0.4s ease-in-out',
        overflowY: 'auto'
      }}>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{color: '#64748b', fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6}}>Your trip plan</div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)'}}>
          <div style={{color: '#0f172a', fontWeight: 700, fontSize: isDesktop ? 17 : 16}}>Your Trip Plan</div>
          <div style={{display: 'flex', gap: 8}}>
            {isDesktop && (
              <>
                <button
                  onClick={handleSaveTrip}
                  disabled={aiLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: aiLoading ? 'rgba(255, 255, 255, 0.05)' : saveSuccess ? 'rgba(76, 175, 80, 0.15)' : 'rgba(25, 118, 210, 0.15)',
                    border: aiLoading ? '1px solid rgba(255, 255, 255, 0.1)' : saveSuccess ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(25, 118, 210, 0.3)',
                    color: aiLoading ? '#6b7280' : saveSuccess ? '#388e3c' : '#1976d2',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: 100,
                    opacity: aiLoading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!saveSuccess) {
                      e.target.style.background = 'rgba(25, 118, 210, 0.25)';
                      e.target.style.borderColor = 'rgba(25, 118, 210, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveSuccess) {
                      e.target.style.background = 'rgba(25, 118, 210, 0.15)';
                      e.target.style.borderColor = 'rgba(25, 118, 210, 0.3)';
                    }
                  }}
                >
                  {saveSuccess ? '✓ Saved' : '💾 Save Trip'}
                </button>
                <button
                  onClick={() => setShowAssistant(true)}
                  disabled={aiLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: aiLoading ? 'rgba(15, 23, 42, 0.03)' : 'rgba(15, 23, 42, 0.05)',
                    border: '1px solid var(--border)',
                    color: aiLoading ? '#6b7280' : '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: aiLoading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  ✏️ Refine
                </button>
              </>
            )}
          </div>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 10}}>
          {/* Flight Card - Accordion */}
          <div style={{
            borderRadius: 8,
            background: openSection === 'flight' ? 'rgba(66, 165, 245, 0.06)' : 'rgba(66, 165, 245, 0.03)',
            border: '1px solid rgba(66, 165, 245, 0.15)',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            <div 
              onClick={() => setOpenSection(openSection === 'flight' ? null : 'flight')}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '13px 16px',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(66, 165, 245, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
                <span style={{fontSize: 17}}>✈️</span>
                <div style={{color: '#1976d2', fontWeight: 600, fontSize: 14}}>Flight</div>
              </div>
              <span style={{color: '#1976d2', fontSize: 14, transform: openSection === 'flight' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'inline-block'}}>▼</span>
            </div>
            {openSection === 'flight' && (
              <div style={{padding: '0 16px 16px 16px'}}>
                <div style={{color: '#e3f2fd', fontSize: 14, fontWeight: 600, marginBottom: 8}}>
                  Book a {lastPlan.flight?.type || 'direct'} {lastPlan.flight?.timing || 'morning'} flight
                </div>
                <div style={{color: '#0f172a', fontSize: 13, lineHeight: 1.5}}>
                  <strong>Why?</strong> {lastPlan.flight?.timing === 'morning' 
                    ? 'Morning flights help you arrive fresh and make the most of your first day.' 
                    : 'Evening departures give you a full day before travel and arrive relaxed.'} {lastPlan.flight?.type === 'direct' 
                    ? 'Direct flights save time and avoid connection hassles.' 
                    : 'One-stop options offer better flexibility and often better prices.'}
                </div>
              </div>
            )}
          </div>
          
          {/* Hotel Card - Accordion */}
          <div style={{
            borderRadius: 8,
            background: openSection === 'hotel' ? 'rgba(102, 187, 106, 0.06)' : 'rgba(102, 187, 106, 0.03)',
            border: '1px solid rgba(102, 187, 106, 0.15)',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            <div 
              onClick={() => setOpenSection(openSection === 'hotel' ? null : 'hotel')}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '13px 16px',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 187, 106, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
                <span style={{fontSize: 17}}>🏨</span>
                <div style={{color: '#81c784', fontWeight: 600, fontSize: 14}}>Hotel Area</div>
              </div>
              <span style={{color: '#81c784', fontSize: 14, transform: openSection === 'hotel' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'inline-block'}}>▼</span>
            </div>
            {openSection === 'hotel' && (
              <div style={{padding: '0 16px 16px 16px'}}>
                <div style={{color: '#c8e6c9', fontSize: 14, fontWeight: 600, marginBottom: 8}}>
                  Stay in {lastPlan.hotelArea?.area || 'city center'}
                </div>
                <div style={{color: '#81c784', fontSize: 13, lineHeight: 1.5}}>
                  <strong>Why?</strong> {lastPlan.hotelArea?.area?.includes('central') || lastPlan.hotelArea?.area?.includes('city center')
                    ? 'Central locations put you minutes away from top attractions and save valuable travel time.'
                    : lastPlan.hotelArea?.area?.includes('near main attractions')
                    ? 'Being close to main attractions means easy access for the whole family with minimal transit.'
                    : lastPlan.hotelArea?.area?.includes('quiet') || lastPlan.hotelArea?.area?.includes('scenic')
                    ? 'Peaceful areas offer better rest and a more intimate experience away from tourist crowds.'
                    : lastPlan.hotelArea?.area?.includes('peaceful')
                    ? 'Longer stays demand tranquility—this area ensures you recharge properly each day.'
                    : 'This location balances convenience with comfort, giving you the best of both worlds.'}
                </div>
              </div>
            )}
          </div>
          
          {/* Itinerary Card - Accordion */}
          <div style={{
            borderRadius: 8,
            background: openSection === 'itinerary' ? 'rgba(255, 152, 0, 0.06)' : 'rgba(255, 152, 0, 0.03)',
            border: '1px solid rgba(255, 152, 0, 0.15)',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            <div 
              onClick={() => setOpenSection(openSection === 'itinerary' ? null : 'itinerary')}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '13px 16px',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 152, 0, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
                <span style={{fontSize: 17}}>🗓️</span>
                <div style={{color: '#ffb74d', fontWeight: 600, fontSize: 14}}>Itinerary</div>
              </div>
              <span style={{color: '#ffb74d', fontSize: 14, transform: openSection === 'itinerary' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'inline-block'}}>▼</span>
            </div>
            {openSection === 'itinerary' && (
              <div style={{padding: '0 16px 16px 16px'}}>
                {/* Day Navigator + Summary */}
                {(() => {
                  const days = lastPlan.itinerary?.plan || [];
                  const active = days.find(d => d.day === activeDay) || days[0];
                  const summary = (active?.activity || '').split('. ')[0];
                  return (
                    <>
                      <div style={{
                        display: 'flex',
                        overflowX: 'auto',
                        gap: 8,
                        padding: '6px 2px 10px 2px'
                      }}>
                        {days.map(d => (
                          <button
                            key={d.day}
                            onClick={() => setActiveDay(d.day)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 14,
                              border: activeDay === d.day ? '1px solid rgba(255, 152, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                              background: activeDay === d.day ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                              color: activeDay === d.day ? '#f59e0b' : '#1976d2',
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                          >
                            Day {d.day}
                          </button>
                        ))}
                      </div>
                      <div style={{
                        padding: '12px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 152, 0, 0.06)',
                        border: '1px solid rgba(255, 152, 0, 0.15)',
                        marginBottom: 10
                      }}>
                        <div style={{ color: '#ffb74d', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Day {active?.day} Summary</div>
                        <div style={{ color: '#050505', fontSize: 13, lineHeight: 1.5 }}>{summary || active?.activity}</div>
                      </div>
                    </>
                  );
                })()}
                {isDesktop ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {lastPlan.itinerary?.plan?.map(d => (
                      <div key={d.day} style={{
                        background: 'rgba(15, 23, 42, 0.04)',
                        borderRadius: 6,
                        borderLeft: '3px solid rgba(255, 152, 0, 0.6)',
                        overflow: 'hidden'
                      }}>
                        <div 
                          onClick={() => setExpandedDay(expandedDay === d.day ? null : d.day)}
                          style={{
                            padding: '11px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 152, 0, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <span style={{fontWeight: 600, color: '#b45309', fontSize: 13}}>Day {d.day}</span>
                             {d.purpose && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: 4,
                                 background: d.purpose === 'explore' ? 'rgba(25, 118, 210, 0.15)' : d.purpose === 'relax' ? 'rgba(102, 187, 106, 0.15)' : 'rgba(158, 158, 158, 0.15)',
                                 color: d.purpose === 'explore' ? '#1976d2' : d.purpose === 'relax' ? '#388e3c' : '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {d.purpose}
                              </span>
                            )}
                          </div>
                          <span style={{
                            color: '#ffb74d', 
                            fontSize: 12, 
                            transform: expandedDay === d.day ? 'rotate(180deg)' : 'rotate(0deg)', 
                            transition: 'transform 0.2s ease',
                            display: 'inline-block'
                          }}>▼</span>
                        </div>
                        {expandedDay === d.day && (
                           <div style={{
                             padding: '0 12px 11px 12px',
                             color: '#0f172a',
                            fontSize: 13,
                            lineHeight: 1.5,
                            borderTop: '1px solid rgba(255, 152, 0, 0.15)'
                          }}>
                            {d.activity}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {lastPlan.itinerary?.plan?.map(d => (
                       <div key={d.day} style={{
                         padding: '11px 12px',
                         background: 'rgba(15, 23, 42, 0.04)',
                        borderRadius: 6,
                        borderLeft: '3px solid rgba(255, 152, 0, 0.6)'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5}}>
                          <span style={{fontWeight: 600, color: '#ffe0b2', fontSize: 13}}>Day {d.day}</span>
                          {d.purpose && (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: d.purpose === 'explore' ? 'rgba(66, 165, 245, 0.2)' : d.purpose === 'relax' ? 'rgba(102, 187, 106, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                              color: d.purpose === 'explore' ? '#90caf9' : d.purpose === 'relax' ? '#81c784' : '#bdbdbd',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {d.purpose}
                            </span>
                          )}
                        </div>
                         <div style={{color: '#0f172a', fontSize: 13, lineHeight: 1.5}}>{d.activity}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Booking buttons */}
          <div style={{marginTop: 6}}>
            <BookButtons destination={lastPlan.parsed?.destinationCity} days={lastPlan.parsed?.numberOfDays} />
          </div>
          
          {/* Quick Action Buttons */}
          <div style={{marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8}}>
            <button onClick={async () => {
              if (aiLoading || refinementLoading) return;
              
              setRefinementLoading(true);
              
              const refinedResult = await refineItineraryWithAI({
                tripPlan: lastPlan,
                refinementType: 'budget'
              });
              
              if (refinedResult && refinedResult.itinerary) {
                // Update plan with AI-refined itinerary
                const updatedPlan = {
                  ...lastPlan,
                  itinerary: {
                    ...lastPlan.itinerary,
                    plan: refinedResult.itinerary.map(day => ({
                      day: day.day,
                      activity: `${day.title}. ${day.plan}`,
                      purpose: day.day === 1 ? 'travel' : 
                               day.day === lastPlan.parsed.numberOfDays ? 'travel' : 
                               day.day <= Math.ceil((lastPlan.parsed.numberOfDays - 2) * 0.7) + 1 ? 'explore' : 'relax'
                    }))
                  },
                  hotelArea: {
                    area: 'budget-friendly neighborhoods',
                    reason: 'Affordable areas with good local transport connections keep costs down while staying comfortable.'
                  }
                };
                setLastPlan(updatedPlan);
                
                const userMsg = { id: Date.now(), sender: 'user', text: 'Make it more budget friendly' };
                const botMsg = { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: 'I\'ve optimized the itinerary for budget travel. Check the changes above.' 
                };
                setMessages(prev => [...prev, userMsg, botMsg]);
              } else {
                // Fallback to simple update
                const updatedPlan = {
                  ...lastPlan,
                  hotelArea: {
                    area: 'budget-friendly neighborhoods',
                    reason: 'Affordable areas with good local transport connections keep costs down while staying comfortable.'
                  }
                };
                setLastPlan(updatedPlan);
                
                const userMsg = { id: Date.now(), sender: 'user', text: 'Make it more budget friendly' };
                const botMsg = { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: 'I\'ve made the plan more budget-friendly. Check above.' 
                };
                setMessages(prev => [...prev, userMsg, botMsg]);
              }
              
              setRefinementLoading(false);
            }} 
            disabled={aiLoading || refinementLoading}
            style={{
              padding: '10px 10px',
              borderRadius: 6,
              border: (aiLoading || refinementLoading) ? '1px solid rgba(76, 175, 80, 0.15)' : '1px solid rgba(76, 175, 80, 0.3)',
              background: (aiLoading || refinementLoading) ? 'rgba(76, 175, 80, 0.03)' : 'rgba(76, 175, 80, 0.08)',
              color: (aiLoading || refinementLoading) ? '#4a5d4a' : '#81c784',
              fontSize: 12,
              fontWeight: 500,
              cursor: (aiLoading || refinementLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (aiLoading || refinementLoading) ? 0.5 : 1
            }} onMouseEnter={(e) => {
              if (!aiLoading && !refinementLoading) {
                e.target.style.background = 'rgba(76, 175, 80, 0.15)';
                e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)';
              }
            }} onMouseLeave={(e) => {
              if (!aiLoading && !refinementLoading) {
                e.target.style.background = 'rgba(76, 175, 80, 0.08)';
                e.target.style.borderColor = 'rgba(76, 175, 80, 0.3)';
              }
            }}>
              {refinementLoading ? '⏳' : '💰'} Budget Friendly
            </button>
            
            <button onClick={async () => {
              if (aiLoading || refinementLoading) return;
              
              setRefinementLoading(true);
              
              const refinedResult = await refineItineraryWithAI({
                tripPlan: lastPlan,
                refinementType: 'relaxed'
              });
              
              if (refinedResult && refinedResult.itinerary) {
                // Update plan with AI-refined itinerary
                const updatedPlan = {
                  ...lastPlan,
                  itinerary: {
                    ...lastPlan.itinerary,
                    plan: refinedResult.itinerary.map(day => ({
                      day: day.day,
                      activity: `${day.title}. ${day.plan}`,
                      purpose: day.day === 1 ? 'travel' : 
                               day.day === lastPlan.parsed.numberOfDays ? 'travel' : 'relax'
                    }))
                  }
                };
                setLastPlan(updatedPlan);
                
                const userMsg = { id: Date.now(), sender: 'user', text: 'Make it more relaxed' };
                const botMsg = { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: 'I\'ve made the plan more relaxed. Check the itinerary above.' 
                };
                setMessages(prev => [...prev, userMsg, botMsg]);
              } else {
                // Fallback to simple update
                const updatedItinerary = lastPlan.itinerary?.plan?.map(day => {
                  if (day.purpose === 'explore') {
                    return {
                      ...day,
                      activity: day.activity.replace(/Explore iconic landmarks/g, 'Visit a few key landmarks')
                        .replace(/Discover hidden gems/g, 'Leisurely explore nearby areas')
                        .replace(/Wander through markets/g, 'Stroll through local spots')
                        .replace(/Experience adventure activities/g, 'Try light activities at your pace'),
                      purpose: 'relax'
                    };
                  }
                  return day;
                });
                
                const updatedPlan = {
                  ...lastPlan,
                  itinerary: {
                    ...lastPlan.itinerary,
                    plan: updatedItinerary
                  }
                };
                setLastPlan(updatedPlan);
                
                const userMsg = { id: Date.now(), sender: 'user', text: 'Make it more relaxed' };
                const botMsg = { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: 'I\'ve slowed down the itinerary. Check above.' 
                };
                setMessages(prev => [...prev, userMsg, botMsg]);
              }
              
              setRefinementLoading(false);
            }} 
            disabled={aiLoading || refinementLoading}
            style={{
              padding: '10px 10px',
              borderRadius: 6,
              border: (aiLoading || refinementLoading) ? '1px solid rgba(255, 193, 7, 0.15)' : '1px solid rgba(255, 193, 7, 0.3)',
              background: (aiLoading || refinementLoading) ? 'rgba(255, 193, 7, 0.03)' : 'rgba(255, 193, 7, 0.08)',
              color: (aiLoading || refinementLoading) ? '#6b5c3a' : '#ffb74d',
              fontSize: 12,
              fontWeight: 500,
              cursor: (aiLoading || refinementLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (aiLoading || refinementLoading) ? 0.5 : 1
            }} onMouseEnter={(e) => {
              if (!aiLoading && !refinementLoading) {
                e.target.style.background = 'rgba(255, 193, 7, 0.15)';
                e.target.style.borderColor = 'rgba(255, 193, 7, 0.5)';
              }
            }} onMouseLeave={(e) => {
              if (!aiLoading && !refinementLoading) {
                e.target.style.background = 'rgba(255, 193, 7, 0.08)';
                e.target.style.borderColor = 'rgba(255, 193, 7, 0.3)';
              }
            }}>
              {refinementLoading ? '⏳' : '🌴'} More Relaxed
            </button>
            
            <button onClick={async () => {
              if (aiLoading || refinementLoading) return;
              
              setRefinementLoading(true);
              
              const refinedResult = await refineItineraryWithAI({
                tripPlan: lastPlan,
                refinementType: 'add-day'
              });
              
              const currentDays = lastPlan.parsed?.numberOfDays || 3;
              const newTotalDays = currentDays + 1;
              
              if (refinedResult && refinedResult.itinerary) {
                // Update plan with AI-refined itinerary (now includes the extra day)
                const updatedPlan = {
                  ...lastPlan,
                  parsed: {
                    ...lastPlan.parsed,
                    numberOfDays: newTotalDays
                  },
                  itinerary: {
                    ...lastPlan.itinerary,
                    days: newTotalDays,
                    plan: refinedResult.itinerary.map(day => ({
                      day: day.day,
                      activity: `${day.title}. ${day.plan}`,
                      purpose: day.day === 1 ? 'travel' : 
                               day.day === newTotalDays ? 'travel' : 
                               day.day <= Math.ceil((newTotalDays - 2) * 0.7) + 1 ? 'explore' : 'relax'
                    }))
                  }
                };
                setLastPlan(updatedPlan);
                setTripContext(prev => ({...prev, days: newTotalDays}));
                
                const userMsg = { id: Date.now(), sender: 'user', text: 'Add one more day' };
                const botMsg = { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: `I've added one more day to your trip. Check the new day above.` 
                };
                setMessages(prev => [...prev, userMsg, botMsg]);
              } else {
                // Fallback to simple update
                const newDayActivity = {
                  day: currentDays,
                  activity: 'Bonus day to revisit favorite spots or discover something new',
                  purpose: 'explore'
                };
                
                const updatedPlan = lastPlan.itinerary?.plan ? [...lastPlan.itinerary.plan] : [];
                updatedPlan.splice(updatedPlan.length - 1, 0, newDayActivity);
                
                if (updatedPlan.length > 0) {
                  updatedPlan[updatedPlan.length - 1] = {
                    ...updatedPlan[updatedPlan.length - 1],
                    day: newTotalDays
                  };
                }
                
                const updatedLastPlan = {
                  ...lastPlan,
                  parsed: {
                    ...lastPlan.parsed,
                    numberOfDays: newTotalDays
                  },
                  itinerary: {
                    ...lastPlan.itinerary,
                    days: newTotalDays,
                    plan: updatedPlan
                  }
                };
                
                setLastPlan(updatedLastPlan);
                setTripContext(prev => ({...prev, days: newTotalDays}));
                
                const userMsg = { id: Date.now(), sender: 'user', text: 'Add one more day' };
                const botMsg = { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: `I've added one more day. Check above.` 
                };
                setMessages(prev => [...prev, userMsg, botMsg]);
              }
              
              setRefinementLoading(false);
            }} 
            disabled={aiLoading || refinementLoading}
            style={{
              padding: '10px 10px',
              borderRadius: 6,
              border: (aiLoading || refinementLoading) ? '1px solid rgba(244, 67, 54, 0.15)' : '1px solid rgba(244, 67, 54, 0.3)',
              background: (aiLoading || refinementLoading) ? 'rgba(244, 67, 54, 0.03)' : 'rgba(244, 67, 54, 0.08)',
              color: (aiLoading || refinementLoading) ? '#6b4342' : '#ef5350',
              fontSize: 12,
              fontWeight: 500,
              cursor: (aiLoading || refinementLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (aiLoading || refinementLoading) ? 0.5 : 1
            }} onMouseEnter={(e) => {
              if (!aiLoading && !refinementLoading) {
                e.target.style.background = 'rgba(244, 67, 54, 0.15)';
                e.target.style.borderColor = 'rgba(244, 67, 54, 0.5)';
              }
            }} onMouseLeave={(e) => {
              if (!aiLoading && !refinementLoading) {
                e.target.style.background = 'rgba(244, 67, 54, 0.08)';
                e.target.style.borderColor = 'rgba(244, 67, 54, 0.3)';
              }
            }}>
              {refinementLoading ? '⏳' : '➕'} Add 1 Day
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Mobile action bar - only on mobile */}
      {!isDesktop && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, #1e2227, #191c20)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          zIndex: 30,
          flexShrink: 0,
          boxShadow: '0 -6px 16px rgba(0,0,0,0.25)'
        }}>
          <button
            onClick={handleSaveTrip}
            style={{
              flex: '1',
              maxWidth: '180px',
              padding: '12px 16px',
              borderRadius: 8,
              background: saveSuccess ? 'linear-gradient(90deg, #388e3c, #66bb6a)' : 'rgba(25, 118, 210, 0.2)',
              border: saveSuccess ? 'none' : '1px solid rgba(25, 118, 210, 0.4)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: saveSuccess ? '0 2px 8px rgba(56, 142, 60, 0.3)' : '0 2px 8px rgba(25, 118, 210, 0.2)'
            }}
          >
            {saveSuccess ? '✓ Saved' : '💾 Save'}
          </button>
          
          <button
            onClick={() => {
              const dest = lastPlan.parsed?.destinationCity || '';
              const today = new Date();
              const start = today.toISOString().slice(0,10);
              const flightUrl = `https://www.google.com/search?q=flights+to+${encodeURIComponent(dest)}+${start}`;
              window.open(flightUrl, '_blank');
            }}
            style={{
              flex: '1',
              maxWidth: '180px',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #1976d2, #2196f3)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.3)';
            }}
          >
            ✈️ Flight
          </button>
          
          <button
            onClick={() => {
              const dest = lastPlan.parsed?.destinationCity || '';
              const days = lastPlan.parsed?.numberOfDays || '';
              const today = new Date();
              const start = today.toISOString().slice(0,10);
              let end = start;
              if (days && Number(days) > 0) {
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + Number(days));
                end = endDate.toISOString().slice(0,10);
              }
              const hotelUrl = `https://www.google.com/search?q=hotels+in+${encodeURIComponent(dest)}+${start}+to+${end}`;
              window.open(hotelUrl, '_blank');
            }}
            style={{
              flex: '1',
              maxWidth: '180px',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #388e3c, #66bb6a)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(56, 142, 60, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(56, 142, 60, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(56, 142, 60, 0.3)';
            }}
          >
            🏨 Hotel
          </button>
          
          <button
            onClick={() => {
              setShowAssistant(true);
            }}
            style={{
              flex: '1',
              maxWidth: '180px',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e3e6eb',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.12)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            ✏️ Refine
          </button>
        </div>
      )}
    </div>
  );
}

function BookButtons({ destination, days }) {
  const [hover, setHover] = React.useState('');
  if (!destination) return null;
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  let end = start;
  if (days && days > 0) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + Number(days));
    end = endDate.toISOString().slice(0, 10);
  }
  const flightUrl = `https://www.google.com/search?q=flights+to+${encodeURIComponent(destination)}+${start}`;
  const hotelUrl = `https://www.google.com/search?q=hotels+in+${encodeURIComponent(destination)}+${start}+to+${end}`;

  const btnBase = {
    display: 'inline-block',
    minWidth: 120,
    padding: '14px 0',
    borderRadius: 9,
    fontWeight: 600,
    fontSize: 16,
    textAlign: 'center',
    textDecoration: 'none',
    transition: 'background 0.18s, box-shadow 0.18s',
    boxShadow: '0 2px 8px #0002',
    outline: 'none',
    border: 'none',
    margin: 0,
    cursor: 'pointer',
    marginRight: 6
  };

  const flightBtn = {
    ...btnBase,
    background: 'linear-gradient(90deg, #1976d2 60%, #2196f3 100%)',
    color: '#fff',
    border: '1.5px solid #1565c0',
  };
  const hotelBtn = {
    ...btnBase,
    background: 'linear-gradient(90deg, #388e3c 60%, #66bb6a 100%)',
    color: '#fff',
    border: '1.5px solid #2e7d32',
  };

  const flightHover = {
    background: 'linear-gradient(90deg, #2196f3 60%, #1976d2 100%)',
    boxShadow: '0 4px 16px #1976d255',
  };
  const hotelHover = {
    background: 'linear-gradient(90deg, #66bb6a 60%, #388e3c 100%)',
    boxShadow: '0 4px 16px #388e3c55',
  };

  return (
    <>
      <a
        href={flightUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={hover === 'flight' ? { ...flightBtn, ...flightHover } : flightBtn}
        onMouseEnter={() => setHover('flight')}
        onMouseLeave={() => setHover('')}
      >
        Book Flight
      </a>
      <a
        href={hotelUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={hover === 'hotel' ? { ...hotelBtn, ...hotelHover } : hotelBtn}
        onMouseEnter={() => setHover('hotel')}
        onMouseLeave={() => setHover('')}
      >
        Book Hotel
      </a>
    </>
  );
}

export default TripPlanPage;
