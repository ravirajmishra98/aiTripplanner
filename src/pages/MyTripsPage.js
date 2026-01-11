import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyTripsPage({ isDesktop, setLastPlan, setTripContext }) {
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);

  useEffect(() => {
    // Load saved trips from localStorage
    const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    // Sort by most recent first
    setSavedTrips(trips.sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
  }, []);

  const handleTripClick = (trip) => {
    // Load the trip into state and navigate to plan page
    setLastPlan(trip.plan);
    setTripContext(trip.tripContext);
    navigate('/plan');
  };

  const handleDeleteTrip = (tripId, e) => {
    e.stopPropagation(); // Prevent card click
    const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    const filtered = trips.filter(t => t.id !== tripId);
    localStorage.setItem('savedTrips', JSON.stringify(filtered));
    setSavedTrips(filtered);
  };

  if (savedTrips.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isDesktop ? '60px 40px' : '40px 20px',
        overflowY: 'auto'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🗺️</div>
          <h1 style={{ 
            color: '#0f172a', 
            fontSize: isDesktop ? 32 : 24, 
            fontWeight: 700, 
            marginBottom: 16 
          }}>
            My Trips
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: isDesktop ? 16 : 14, 
            lineHeight: 1.6 
          }}>
            No saved trips yet. Create a trip plan and save it to see it here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: isDesktop ? '40px 40px' : '24px 20px',
      overflowY: 'auto',
      animation: 'fadeIn 0.4s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          color: '#0f172a',
          fontSize: isDesktop ? 42 : 32,
          fontWeight: 800,
          marginBottom: 8,
          letterSpacing: '-1px'
        }}>
          My Trips
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: isDesktop ? 15 : 14
        }}>
          {savedTrips.length} saved {savedTrips.length === 1 ? 'trip' : 'trips'}
        </p>
      </div>

      {/* Trips Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
        gap: isDesktop ? 20 : 16,
        maxWidth: '1200px'
      }}>
        {savedTrips.map((trip) => {
          const { tripContext = {}, savedAt, id } = trip;
          if (!tripContext || !id) return null;
          const date = new Date(savedAt);
          const formattedDate = date.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          });

          return (
            <div
              key={id}
              onClick={() => handleTripClick(trip)}
              style={{
                padding: isDesktop ? 24 : 20,
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease-out',
                position: 'relative',
                overflow: 'hidden'
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
              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteTrip(id, e)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef5350';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ✕
              </button>

              {/* Trip Icon */}
              <div style={{
                fontSize: 36,
                marginBottom: 16
              }}>
                {tripContext.pace === 'family' ? '👨‍👩‍👧' : 
                 tripContext.pace === 'solo' ? '🧳' : 
                 tripContext.pace === 'couple' ? '💑' : '✈️'}
              </div>

              {/* Destination */}
              <h3 style={{
                color: '#0f172a',
                fontSize: isDesktop ? 18 : 16,
                fontWeight: 700,
                marginBottom: 12,
                letterSpacing: '-0.3px'
              }}>
                {tripContext.from && tripContext.to 
                  ? `${tripContext.from} → ${tripContext.to}`
                  : tripContext.to || 'Trip Plan'}
              </h3>

              {/* Trip Details */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 16
              }}>
                {tripContext.days && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#475569',
                    fontSize: 13
                  }}>
                    <span>📅</span>
                    <span>{tripContext.days} days</span>
                  </div>
                )}
                {tripContext.pace && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#475569',
                    fontSize: 13
                  }}>
                    <span>🎯</span>
                    <span style={{ textTransform: 'capitalize' }}>{tripContext.pace}</span>
                  </div>
                )}
              </div>

              {/* Saved Date */}
              <div style={{
                color: '#cbd5e1',
                fontSize: 12,
                fontWeight: 500
              }}>
                Saved on {formattedDate}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyTripsPage;
