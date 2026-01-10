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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          color: '#0f172a',
          fontSize: isDesktop ? 32 : 24,
          fontWeight: 800,
          marginBottom: 8,
          letterSpacing: '-0.5px'
        }}>
          My Trips
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: isDesktop ? 16 : 14
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
          const { tripContext, savedAt, id } = trip;
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
                background: (() => {
                  const gradients = [
                    'linear-gradient(135deg, rgba(191, 219, 254, 0.75), rgba(219, 234, 254, 0.95))',
                    'linear-gradient(135deg, rgba(254, 205, 211, 0.75), rgba(254, 226, 226, 0.95))',
                    'linear-gradient(135deg, rgba(187, 247, 208, 0.75), rgba(220, 252, 231, 0.95))',
                    'linear-gradient(135deg, rgba(254, 215, 170, 0.75), rgba(254, 243, 199, 0.95))',
                    'linear-gradient(135deg, rgba(221, 214, 254, 0.75), rgba(243, 232, 255, 0.95))'
                  ];
                  return gradients[savedTrips.indexOf(trip) % gradients.length];
                })(),
                border: (() => {
                  const borders = [
                    'rgba(25, 118, 210, 0.2)',
                    'rgba(244, 63, 94, 0.2)',
                    'rgba(34, 197, 94, 0.2)',
                    'rgba(249, 115, 22, 0.2)',
                    'rgba(168, 85, 247, 0.2)'
                  ];
                  return '1px solid ' + borders[savedTrips.indexOf(trip) % borders.length];
                })(),
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                const hoverGradients = [
                  'linear-gradient(135deg, rgba(25, 118, 210, 0.4), rgba(25, 118, 210, 0.3))',
                  'linear-gradient(135deg, rgba(244, 63, 94, 0.4), rgba(244, 63, 94, 0.3))',
                  'linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(34, 197, 94, 0.3))',
                  'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(249, 115, 22, 0.3))',
                  'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(168, 85, 247, 0.3))'
                ];
                const hoverBorders = [
                  'rgba(25, 118, 210, 0.5)',
                  'rgba(244, 63, 94, 0.5)',
                  'rgba(34, 197, 94, 0.5)',
                  'rgba(249, 115, 22, 0.5)',
                  'rgba(168, 85, 247, 0.5)'
                ];
                const hoverShadows = [
                  'rgba(25, 118, 210, 0.3)',
                  'rgba(244, 63, 94, 0.3)',
                  'rgba(34, 197, 94, 0.3)',
                  'rgba(249, 115, 22, 0.3)',
                  'rgba(168, 85, 247, 0.3)'
                ];
                const idx = savedTrips.indexOf(trip) % 5;
                e.currentTarget.style.background = hoverGradients[idx];
                e.currentTarget.style.borderColor = hoverBorders[idx];
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px ' + hoverShadows[idx];
              }}
              onMouseLeave={(e) => {
                const gradients = [
                  'linear-gradient(135deg, rgba(191, 219, 254, 0.75), rgba(219, 234, 254, 0.95))',
                  'linear-gradient(135deg, rgba(254, 205, 211, 0.75), rgba(254, 226, 226, 0.95))',
                  'linear-gradient(135deg, rgba(187, 247, 208, 0.75), rgba(220, 252, 231, 0.95))',
                  'linear-gradient(135deg, rgba(254, 215, 170, 0.75), rgba(254, 243, 199, 0.95))',
                  'linear-gradient(135deg, rgba(221, 214, 254, 0.75), rgba(243, 232, 255, 0.95))'
                ];
                const borders = [
                  'rgba(25, 118, 210, 0.2)',
                  'rgba(244, 63, 94, 0.2)',
                  'rgba(34, 197, 94, 0.2)',
                  'rgba(249, 115, 22, 0.2)',
                  'rgba(168, 85, 247, 0.2)'
                ];
                const idx = savedTrips.indexOf(trip) % 5;
                e.currentTarget.style.background = gradients[idx];
                e.currentTarget.style.borderColor = '1px solid ' + borders[idx];
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
                  background: 'rgba(244, 67, 54, 0.15)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  color: '#ef5350',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 67, 54, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(244, 67, 54, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 67, 54, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(244, 67, 54, 0.3)';
                }}
              >
                🗑️
              </button>

              {/* Trip Icon */}
              <div style={{
                fontSize: 40,
                marginBottom: 16
              }}>
                {tripContext.pace === 'family' ? '👨‍👩‍👧' : 
                 tripContext.pace === 'solo' ? '🧳' : 
                 tripContext.pace === 'couple' ? '💑' : '✈️'}
              </div>

              {/* Destination */}
              <h3 style={{
                color: '#0f172a',
                fontSize: isDesktop ? 20 : 18,
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
                    color: '#1976d2',
                    fontSize: 14
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
                    color: '#388e3c',
                    fontSize: 14
                  }}>
                    <span>🎯</span>
                    <span style={{ textTransform: 'capitalize' }}>{tripContext.pace}</span>
                  </div>
                )}
              </div>

              {/* Saved Date */}
              <div style={{
                color: '#6b7280',
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
