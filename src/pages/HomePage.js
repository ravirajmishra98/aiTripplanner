import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTripPlan } from '../utils/tripPlanner';
import { getImageUrl } from '../services/imageService';

function HomePage({ isDesktop, loading, setLoading, setLastPlan, setTripContext, setMessages, setShowAssistant, language, setLanguage }) {
  const navigate = useNavigate();
  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpInput, setFollowUpInput] = useState('');
  const [originalQuery, setOriginalQuery] = useState('');
  // Primary planning form state
  const [formSourceCity, setFormSourceCity] = useState('');
  const [formDestinationCity, setFormDestinationCity] = useState('');
  const [formDays, setFormDays] = useState('');
  const [formBudget, setFormBudget] = useState('mid-range');
  const [formTripType, setFormTripType] = useState('solo');
  const [heroUrl, setHeroUrl] = useState(null);

  const canSubmitForm = formDestinationCity.trim() && parseInt(formDays) > 0;

  // Home hero city image (random city on mount only, doesn't change until page reload)
  useEffect(() => {
    let active = true;
    const randomCities = ['Goa', 'Kerala', 'Jaipur', 'Manali', 'Udaipur', 'Rishikesh', 'Shimla', 'Ooty', 'Coorg', 'Varanasi'];
    const randomCity = randomCities[Math.floor(Math.random() * randomCities.length)];
    const params = {
      category: 'destination',
      cityName: randomCity
    };
    getImageUrl(params).then((url) => {
      if (active) setHeroUrl(url);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!canSubmitForm) return;
    // Navigate to /plan with router state from form
    navigate('/plan', {
      state: {
        source: 'home-form',
        sourceCity: formSourceCity.trim(),
        destination: formDestinationCity.trim(),
        numberOfDays: parseInt(formDays),
        budget: formBudget,
        tripType: formTripType
      }
    });
  };

  const handleFollowUpSubmit = () => {
    if (!followUpInput.trim() || !originalQuery) return;
    
    // Combine original query with user's answer
    const combinedQuery = `${originalQuery} From ${followUpInput}.`;
    setFollowUpModal(null);
    setFollowUpInput('');
    setOriginalQuery('');
    
    // Retry with combined query
    setLoading(true);
    setTimeout(() => {
      const result = createTripPlan(combinedQuery, language);
      
      if (result.plan) {
        // Plan generated successfully
        const { parsed } = result.plan;
        setLoading(false);
        
        navigate('/plan', {
          state: {
            tripPlan: result.plan,
            tripContext: {
              from: parsed?.sourceCity || '',
              to: parsed?.destinationCity || '',
              days: parsed?.numberOfDays || '',
              pace: parsed?.travelType || ''
            },
            source: 'trip-idea'
          }
        });
      } else if (result.followUpQuestions && result.followUpQuestions.length > 0) {
        // Still need more info - show modal again
        setOriginalQuery(combinedQuery);
        setFollowUpModal(result.followUpQuestions[0]);
        setFollowUpInput('');
      } else {
        setLoading(false);
      }
    }, 800);
  };

  const handleTripIdea = (idea) => {
    setLoading(true);
    setTimeout(() => {
      const result = createTripPlan(idea.query, language);
      
      if (result.plan) {
        // Plan generated successfully - navigate to /plan with state
        const { parsed } = result.plan;
        
        setLoading(false);
        
        // Navigate to /plan with trip state (TripPlanPage will pick it up)
        navigate('/plan', {
          state: {
            tripPlan: result.plan,
            tripContext: {
              from: parsed?.sourceCity || '',
              to: parsed?.destinationCity || '',
              days: parsed?.numberOfDays || '',
              pace: parsed?.travelType || ''
            },
            source: 'trip-idea'
          }
        });
      } else if (result.followUpQuestions && result.followUpQuestions.length > 0) {
        // Show modal instead of opening chat
        setLoading(false);
        setOriginalQuery(idea.query);
        setFollowUpModal(result.followUpQuestions[0]);
        setFollowUpInput('');
      } else {
        // If parsing fails, show generic error
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: isDesktop ? '60px 40px' : '40px 20px',
      overflowY: 'auto',
      position: 'relative',
      animation: 'fadeIn 0.4s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(35, 39, 46, 0.95)',
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
          <div style={{
            color: '#64b5f6',
            fontSize: 18,
            fontWeight: 600
          }}>Creating your trip plan...</div>
        </div>
      )}
      
      {/* Centered Content Container */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Hero background wrapper with city image */}
        <div style={{
          width: '100%',
          marginBottom: 48,
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          minHeight: isDesktop ? '300px' : '280px',
          backgroundImage: heroUrl ? `url(${heroUrl})` : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: isDesktop ? '24px' : '16px'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))', zIndex: 1 }} />
          {/* Primary Planning Form over the background */}
          <form onSubmit={handleFormSubmit} style={{
            width: '100%',
            background: 'rgba(224, 231, 241, 0.92)',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            borderRadius: 12,
            padding: isDesktop ? '24px 28px' : '18px 16px',
            overflow: 'visible',
            position: 'relative',
            zIndex: 2
          }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(5, 1fr)' : '1fr',
            gap: isDesktop ? 12 : 10,
            alignItems: 'flex-end',
            width: '100%'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>Source city</label>
              <input
                type="text"
                value={formSourceCity}
                onChange={(e) => setFormSourceCity(e.target.value)}
                placeholder="e.g. Delhi"
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>Destination city</label>
              <input
                type="text"
                value={formDestinationCity}
                onChange={(e) => setFormDestinationCity(e.target.value)}
                placeholder="e.g. Goa"
                required
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>Days</label>
              <input
                type="number"
                min="1"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value)}
                placeholder="e.g. 5"
                required
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>Budget</label>
              <select
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: 14
                }}
              >
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            {/* Center column: Trip Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>Trip type</label>
              <select
                value={formTripType}
                onChange={(e) => setFormTripType(e.target.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: 14
                }}
              >
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="adventure">Adventure</option>
                <option value="wellness">Wellness/Retreat</option>
                <option value="business">Business</option>
                <option value="group">Large Group</option>
              </select>
            </div>
            {/* Right column: Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!canSubmitForm}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 8,
                  background: canSubmitForm ? '#0f172a' : 'rgba(15, 23, 42, 0.4)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: canSubmitForm ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease-out',
                  boxShadow: canSubmitForm ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                  height: 'auto'
                }}
                onMouseEnter={(e) => {
                  if (canSubmitForm) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSubmitForm) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                  }
                }}
              >
                Generate Plan
              </button>
            </div>
          </div>
        </form>
        </div>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            color: 'var(--text)',
            fontSize: isDesktop ? 42 : 32,
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: '-1px',
            lineHeight: 1.1
          }}>Plan your trip in seconds</h1>
          <p style={{
            color: '#64748b',
            fontSize: isDesktop ? 16 : 14,
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 auto',
            fontWeight: 400
          }}>
            Use the form above or pick a trip idea to get started instantly.
          </p>
        </div>

        {/* Trip Ideas Section */}
        <div style={{
          width: '100%',
          marginBottom: 48
        }}>
          <div style={{
            color: '#64748b',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center'
          }}>Popular Trip Ideas</div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: isDesktop ? 20 : 16,
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {[
              { emoji: '🏖️', title: 'First-time Goa', subtitle: '5 days • Beaches', query: 'Create a 5-day trip to Goa. Budget: moderate. Include beaches, water sports, nightlife in North Goa. 3-star hotels, recommended restaurants. Leisure travel style.' },
              { emoji: '🌄', title: 'Weekend Getaway', subtitle: '3 days • Nearby', query: 'Plan a 3-day weekend trip to Shimla. Budget-friendly. Include scenic walks, local markets, cozy cafes. Leisure travel style. Budget accommodation.' },
              { emoji: '💰', title: 'Budget Trip', subtitle: '4 days • Under 10k', query: 'Create a solo budget trip to Jaipur for 4 days. Budget under 10000 rupees. Visit City Palace, Hawa Mahal, local markets. Budget hotels, street food.' },
              { emoji: '👨‍👩‍👧', title: 'Family Comfort', subtitle: '5 days • Relaxed', query: 'Plan a comfortable family trip to Kerala for 5 days. Include backwater houseboat, Munnar hills, relaxing activities. 4-star hotels, family-friendly restaurants.' },
              { emoji: '🧘', title: 'Relaxation', subtitle: '7 days • Leisure', query: 'Design a 7-day couple relaxation vacation to Udaipur. Focus on leisure, spa, yoga, lake views. 5-star hotel, fine dining, rejuvenation activities.' },
              { emoji: '🏔️', title: 'Adventure', subtitle: '6 days • Thrilling', query: 'Create a 6-day solo adventure trip to Manali. Include trekking, paragliding, river rafting, camping. Budget hotels, local guides, high energy activities.' }
            ].map((idea, idx) => (
              <button
                key={idx}
                onClick={() => handleTripIdea(idea)}
                style={{
                  padding: isDesktop ? '28px 24px' : '20px 16px',
                  borderRadius: 12,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: isDesktop ? 40 : 36 }}>{idea.emoji}</div>
                <div>
                  <div style={{ fontSize: isDesktop ? 15 : 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>{idea.title}</div>
                  <div style={{ fontSize: isDesktop ? 12 : 11, color: '#94a3b8', fontWeight: 500 }}>{idea.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Trip Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setShowAssistant(true)}
            style={{
              padding: '14px 32px',
              borderRadius: 8,
              background: '#0f172a',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              letterSpacing: '0.3px',
              height: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span>Talk to AI Assistant</span>
          </button>
        </div>

        {/* Follow-up Question Modal */}
        {followUpModal && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setFollowUpModal(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease-out'
              }}
            />
            {/* Modal */}
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#23272e',
                borderRadius: 16,
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                zIndex: 1001,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                animation: 'slideInUp 0.3s ease-out',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{
                color: '#0f172a',
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
                textAlign: 'center'
              }}>
                One quick question
              </div>
              <div style={{
                color: '#475569',
                fontSize: 16,
                marginBottom: 24,
                textAlign: 'center',
                lineHeight: 1.5
              }}>
                {followUpModal}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFollowUpSubmit();
                  }}
                  placeholder="Your answer..."
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#1e2227',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(25, 118, 210, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                />
                <button
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpInput.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    background: followUpInput.trim() ? '#1976d2' : 'rgba(25, 118, 210, 0.3)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: followUpInput.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (followUpInput.trim()) {
                      e.target.style.background = '#1565c0';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (followUpInput.trim()) {
                      e.target.style.background = '#1976d2';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
