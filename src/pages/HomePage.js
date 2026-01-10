import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTripPlan } from '../utils/tripPlanner';

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

  const canSubmitForm = formDestinationCity.trim() && parseInt(formDays) > 0;

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
        {/* Primary Planning Form */}
        <form onSubmit={handleFormSubmit} style={{
          width: '100%',
          marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.65), rgba(196, 181, 253, 0.55), rgba(253, 186, 116, 0.5))',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
          borderRadius: 16,
          padding: isDesktop ? '14px' : '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '2fr 2fr 1fr' : '1fr',
            gap: isDesktop ? 12 : 10,
            alignItems: 'center'
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
              </select>
            </div>
            {/* Right column: Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!canSubmitForm}
                style={{
                  width: 'auto',
                  padding: isDesktop ? '14px 18px' : '12px 16px',
                  borderRadius: 12,
                  background: canSubmitForm ? 'linear-gradient(135deg, #1976d2, #2196f3)' : 'rgba(25,118,210,0.3)',
                  border: 'none',
                  color: '#fff',
                  fontSize: isDesktop ? 16 : 15,
                  fontWeight: 700,
                  cursor: canSubmitForm ? 'pointer' : 'not-allowed',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: canSubmitForm ? '0 6px 20px rgba(25,118,210,0.35)' : 'none',
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap',
                  minWidth: '160px',
                  maxWidth: '220px'
                }}
                onMouseEnter={(e) => {
                  if (canSubmitForm) {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    e.target.style.boxShadow = '0 10px 28px rgba(25,118,210,0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSubmitForm) {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 6px 20px rgba(25,118,210,0.35)';
                  }
                }}
              >
                Generate Plan
              </button>
            </div>
          </div>
        </form>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            color: 'var(--text)',
            fontSize: isDesktop ? 36 : 28,
            fontWeight: 800,
            marginBottom: 8,
            letterSpacing: '-1px',
            lineHeight: 1.1
          }}>Plan your trip</h1>
          <p style={{
            color: '#334155',
            fontSize: isDesktop ? 15 : 14,
            lineHeight: 1.5,
            maxWidth: '520px',
            margin: '0 auto',
            fontWeight: 400
          }}>
            Get personalized travel plans in seconds. Pick a trip idea or describe your perfect vacation—we'll handle the details.
          </p>
        </div>

        {/* Trip Ideas Section */}
        <div style={{
          width: '100%',
          marginBottom: 32
        }}>
          <div style={{
            color: '#0f172a',
            fontSize: isDesktop ? 22 : 20,
            fontWeight: 700,
            marginBottom: 20,
            textAlign: 'center',
            letterSpacing: '-0.3px'
          }}>Popular Trip Ideas</div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: isDesktop ? 16 : 12
          }}>
            {[
              { emoji: '🏖️', title: 'First-time Goa', subtitle: '5 days • Beaches', query: 'Create a 5-day trip to Goa. Budget: moderate. Include beaches, water sports, nightlife in North Goa. 3-star hotels, recommended restaurants. Luxury travel style.' },
              { emoji: '🌄', title: 'Weekend Getaway', subtitle: '3 days • Nearby', query: 'Plan a 3-day weekend trip to Shimla. Budget-friendly. Include scenic walks, local markets, cozy cafes. Adventure travel style. Budget accommodation.' },
              { emoji: '💰', title: 'Budget Trip', subtitle: 'Under ₹10k', query: 'Create a solo budget trip to Jaipur for 4 days. Budget under 10000 rupees. Visit City Palace, Hawa Mahal, local markets. Budget hotels, street food.' },
              { emoji: '👨‍👩‍👧', title: 'Parents ke saath', subtitle: '5 days • Comfort', query: 'Plan a comfortable family trip to Kerala for 5 days. With family. Include backwater houseboat, Munnar hills, relaxing activities. 4-star hotels, family-friendly restaurants.' },
              { emoji: '🧘', title: 'Relaxed Vacation', subtitle: '7 days • Leisure', query: 'Design a 7-day couple relaxation vacation to Udaipur. With partner. Focus on leisure, spa, yoga, lake views. 5-star hotel, fine dining, rejuvenation activities.' },
              { emoji: '🏔️', title: 'Adventure Trip', subtitle: '6 days • Thrilling', query: 'Create a 6-day solo adventure trip to Manali. Include trekking, paragliding, river rafting, camping. Budget hotels, local guides, high energy activities.' }
            ].map((idea, idx) => (
              <button
                key={idx}
                onClick={() => handleTripIdea(idea)}
                style={{
                  padding: isDesktop ? '24px 20px' : '18px 14px',
                  borderRadius: 14,
                  background: (() => {
                    const gradients = [
                      'linear-gradient(135deg, rgba(191, 219, 254, 0.7), rgba(219, 234, 254, 0.9))',
                      'linear-gradient(135deg, rgba(254, 205, 211, 0.7), rgba(254, 226, 226, 0.9))',
                      'linear-gradient(135deg, rgba(187, 247, 208, 0.7), rgba(220, 252, 231, 0.9))',
                      'linear-gradient(135deg, rgba(254, 215, 170, 0.7), rgba(254, 243, 199, 0.9))',
                      'linear-gradient(135deg, rgba(221, 214, 254, 0.7), rgba(243, 232, 255, 0.9))',
                      'linear-gradient(135deg, rgba(186, 230, 253, 0.7), rgba(224, 242, 254, 0.9))'
                    ];
                    return gradients[idx % gradients.length];
                  })(),
                  border: (() => {
                    const borders = [
                      'rgba(25, 118, 210, 0.2)',
                      'rgba(244, 63, 94, 0.2)',
                      'rgba(34, 197, 94, 0.2)',
                      'rgba(249, 115, 22, 0.2)',
                      'rgba(168, 85, 247, 0.2)',
                      'rgba(3, 155, 229, 0.2)'
                    ];
                    return '1px solid ' + borders[idx % borders.length];
                  })(),
                  color: '#0f172a',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: (() => {
                    const shadows = [
                      'rgba(25, 118, 210, 0.1)',
                      'rgba(244, 63, 94, 0.1)',
                      'rgba(34, 197, 94, 0.1)',
                      'rgba(249, 115, 22, 0.1)',
                      'rgba(168, 85, 247, 0.1)',
                      'rgba(3, 155, 229, 0.1)'
                    ];
                    return '0 3px 10px ' + shadows[idx % shadows.length];
                  })()
                }}
                onMouseEnter={(e) => {
                  const hoverGradients = [
                    'linear-gradient(135deg, rgba(25, 118, 210, 0.35), rgba(25, 118, 210, 0.25))',
                    'linear-gradient(135deg, rgba(244, 63, 94, 0.35), rgba(244, 63, 94, 0.25))',
                    'linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(34, 197, 94, 0.25))',
                    'linear-gradient(135deg, rgba(249, 115, 22, 0.35), rgba(249, 115, 22, 0.25))',
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(168, 85, 247, 0.25))',
                    'linear-gradient(135deg, rgba(3, 155, 229, 0.35), rgba(3, 155, 229, 0.25))'
                  ];
                  const hoverBorders = [
                    'rgba(25, 118, 210, 0.4)',
                    'rgba(244, 63, 94, 0.4)',
                    'rgba(34, 197, 94, 0.4)',
                    'rgba(249, 115, 22, 0.4)',
                    'rgba(168, 85, 247, 0.4)',
                    'rgba(3, 155, 229, 0.4)'
                  ];
                  const hoverShadows = [
                    'rgba(25, 118, 210, 0.25)',
                    'rgba(244, 63, 94, 0.25)',
                    'rgba(34, 197, 94, 0.25)',
                    'rgba(249, 115, 22, 0.25)',
                    'rgba(168, 85, 247, 0.25)',
                    'rgba(3, 155, 229, 0.25)'
                  ];
                  e.currentTarget.style.background = hoverGradients[idx % hoverGradients.length];
                  e.currentTarget.style.borderColor = hoverBorders[idx % hoverBorders.length];
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px ' + hoverShadows[idx % hoverShadows.length];
                }}
                onMouseLeave={(e) => {
                  const gradients = [
                    'linear-gradient(135deg, rgba(191, 219, 254, 0.7), rgba(219, 234, 254, 0.9))',
                    'linear-gradient(135deg, rgba(254, 205, 211, 0.7), rgba(254, 226, 226, 0.9))',
                    'linear-gradient(135deg, rgba(187, 247, 208, 0.7), rgba(220, 252, 231, 0.9))',
                    'linear-gradient(135deg, rgba(254, 215, 170, 0.7), rgba(254, 243, 199, 0.9))',
                    'linear-gradient(135deg, rgba(221, 214, 254, 0.7), rgba(243, 232, 255, 0.9))',
                    'linear-gradient(135deg, rgba(186, 230, 253, 0.7), rgba(224, 242, 254, 0.9))'
                  ];
                  const borders = [
                    'rgba(25, 118, 210, 0.2)',
                    'rgba(244, 63, 94, 0.2)',
                    'rgba(34, 197, 94, 0.2)',
                    'rgba(249, 115, 22, 0.2)',
                    'rgba(168, 85, 247, 0.2)',
                    'rgba(3, 155, 229, 0.2)'
                  ];
                  const shadows = [
                    'rgba(25, 118, 210, 0.1)',
                    'rgba(244, 63, 94, 0.1)',
                    'rgba(34, 197, 94, 0.1)',
                    'rgba(249, 115, 22, 0.1)',
                    'rgba(168, 85, 247, 0.1)',
                    'rgba(3, 155, 229, 0.1)'
                  ];
                  e.currentTarget.style.background = gradients[idx % gradients.length];
                  e.currentTarget.style.borderColor = borders[idx % borders.length];
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px ' + shadows[idx % shadows.length];
                }}
              >
                <div style={{ fontSize: isDesktop ? 42 : 38 }}>{idea.emoji}</div>
                <div>
                  <div style={{ fontSize: isDesktop ? 15 : 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>{idea.title}</div>
                  <div style={{ fontSize: isDesktop ? 13 : 12, color: '#64748b', fontWeight: 500 }}>{idea.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Trip Button */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{
            color: '#7a8a99',
            fontSize: 13,
            marginBottom: 14,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontWeight: 600
          }}>
            Or create custom
          </div>
          <button
            onClick={() => setShowAssistant(true)}
            style={{
              padding: isDesktop ? '16px 40px' : '14px 32px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1976d2, #2196f3)',
              border: 'none',
              color: '#fff',
              fontSize: isDesktop ? 16 : 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              letterSpacing: '0.2px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.boxShadow = '0 10px 28px rgba(25, 118, 210, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.35)';
            }}
          >
            <span style={{ fontSize: 20 }}>✨</span>
            <span>Talk to Assistant</span>
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
