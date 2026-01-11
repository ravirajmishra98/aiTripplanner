import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ExplorePage({ isDesktop }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredDestId, setHoveredDestId] = useState(null);
  const [selectedIntents, setSelectedIntents] = useState([]);

  const intents = [
    { id: 'weekend', label: '3-day weekend', emoji: '📅', color: '#06b6d4' },
    { id: 'family', label: 'Family friendly', emoji: '👨‍👩‍👧‍👦', color: '#8b5cf6' },
    { id: 'budget', label: 'Budget under 10k', emoji: '💰', color: '#10b981' },
    { id: 'relaxed', label: 'Relaxed trip', emoji: '😌', color: '#f59e0b' }
  ];

  const toggleIntent = (intentId) => {
    setSelectedIntents(prev =>
      prev.includes(intentId)
        ? prev.filter(id => id !== intentId)
        : [...prev, intentId]
    );
  };

  const destinations = [
    // Beach destinations
    { id: 'goa', name: 'Goa', country: 'India', category: 'beach', emoji: '🏖️', subtitle: 'Beaches & Nightlife', color: '#fbbf24', defaultDays: 5, defaultTravelType: 'leisure' },
    { id: 'maldives', name: 'Maldives', country: 'Maldives', category: 'beach', emoji: '🌴', subtitle: 'Luxury Islands', color: '#3b82f6', defaultDays: 5, defaultTravelType: 'luxury' },
    { id: 'phuket', name: 'Phuket', country: 'Thailand', category: 'beach', emoji: '🏝️', subtitle: 'Tropical Paradise', color: '#10b981', defaultDays: 5, defaultTravelType: 'leisure' },
    { id: 'bali', name: 'Bali', country: 'Indonesia', category: 'beach', emoji: '🌊', subtitle: 'Surf & Culture', color: '#f59e0b', defaultDays: 5, defaultTravelType: 'leisure' },
    // Hill destinations
    { id: 'manali', name: 'Manali', country: 'India', category: 'hill', emoji: '🏔️', subtitle: 'Mountain Adventures', color: '#8b5cf6', defaultDays: 4, defaultTravelType: 'adventure' },
    { id: 'shimla', name: 'Shimla', country: 'India', category: 'hill', emoji: '⛰️', subtitle: 'Colonial Charm', color: '#ec4899', defaultDays: 3, defaultTravelType: 'leisure' },
    { id: 'darjeeling', name: 'Darjeeling', country: 'India', category: 'hill', emoji: '🌄', subtitle: 'Tea Gardens', color: '#14b8a6', defaultDays: 3, defaultTravelType: 'leisure' },
    { id: 'munnar', name: 'Munnar', country: 'India', category: 'hill', emoji: '🏞️', subtitle: 'Hill Station', color: '#6366f1', defaultDays: 3, defaultTravelType: 'leisure' },
    // City destinations
    { id: 'dubai', name: 'Dubai', country: 'UAE', category: 'city', emoji: '🌆', subtitle: 'Luxury & Shopping', color: '#f59e0b', defaultDays: 4, defaultTravelType: 'luxury' },
    { id: 'singapore', name: 'Singapore', country: 'Singapore', category: 'city', emoji: '🏙️', subtitle: 'Modern Metropolis', color: '#ef4444', defaultDays: 4, defaultTravelType: 'leisure' },
    { id: 'bangkok', name: 'Bangkok', country: 'Thailand', category: 'city', emoji: '🛕', subtitle: 'Culture & Food', color: '#f97316', defaultDays: 4, defaultTravelType: 'leisure' },
    { id: 'mumbai', name: 'Mumbai', country: 'India', category: 'city', emoji: '🌃', subtitle: 'City of Dreams', color: '#06b6d4', defaultDays: 3, defaultTravelType: 'leisure' }
  ];

  const categories = [
    { id: 'all', label: 'All Destinations', emoji: '🌍' },
    { id: 'beach', label: 'Beach', emoji: '🏖️' },
    { id: 'hill', label: 'Hill Stations', emoji: '🏔️' },
    { id: 'city', label: 'Cities', emoji: '🌆' }
  ];

  const getFilteredDestinations = () => {
    if (activeCategory === 'all') {
      return destinations;
    }
    return destinations.filter(dest => dest.category === activeCategory);
  };

  const handleDestinationClick = (dest) => {
    navigate('/plan', {
      state: {
        destination: dest.name,
        numberOfDays: dest.defaultDays,
        travelType: dest.defaultTravelType,
        source: 'explore',
        intents: selectedIntents
      }
    });
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: isDesktop ? '40px 48px' : '24px 20px',
      overflowY: 'auto',
      gap: 32
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        div[role="button"]:focus {
          outline: 2px solid rgba(33, 150, 243, 0.5);
          outline-offset: 2px;
        }
      `}</style>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ 
          color: 'var(--text)', 
          fontSize: isDesktop ? 42 : 32, 
          fontWeight: 800, 
          marginBottom: 12,
          letterSpacing: '-1px'
        }}>
          Explore Destinations
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: isDesktop ? 15 : 14, 
          lineHeight: 1.6,
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          Discover amazing places to visit. Find your next adventure.
        </p>
      </div>

      {/* Intent Chips */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isDesktop ? 12 : 8,
        flexWrap: 'wrap',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{ 
          fontSize: isDesktop ? 12 : 11, 
          color: '#7a8a99',
          fontWeight: 500,
          width: '100%',
          textAlign: 'center',
          marginBottom: 8
        }}>
          Filter by travel style
        </div>
        {intents.map(intent => (
          <button
            key={intent.id}
            onClick={() => toggleIntent(intent.id)}
            style={{
              padding: isDesktop ? '10px 18px' : '8px 14px',
              borderRadius: 8,
              background: selectedIntents.includes(intent.id)
                ? intent.color
                : 'rgba(255,255,255,0.08)',
              border: selectedIntents.includes(intent.id)
                ? `1px solid ${intent.color}`
                : '1px solid rgba(255,255,255,0.12)',
              color: selectedIntents.includes(intent.id) ? '#0f172a' : '#b8c5d6',
              fontSize: isDesktop ? 13 : 12,
              fontWeight: selectedIntents.includes(intent.id) ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!selectedIntents.includes(intent.id)) {
                e.target.style.background = 'rgba(255,255,255,0.12)';
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedIntents.includes(intent.id)) {
                e.target.style.background = 'rgba(255,255,255,0.08)';
                e.target.style.borderColor = 'rgba(255,255,255,0.12)';
              }
            }}
          >
            <span style={{ fontSize: isDesktop ? 14 : 13 }}>{intent.emoji}</span>
            <span>{intent.label}</span>
          </button>
        ))}
      </div>

      {/* Category Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isDesktop ? 12 : 8,
        flexWrap: 'wrap',
        marginBottom: 40
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: isDesktop ? '10px 20px' : '8px 16px',
              borderRadius: 8,
              background: activeCategory === cat.id 
                ? '#0f172a' 
                : '#ffffff',
              border: activeCategory === cat.id 
                ? '1px solid #0f172a' 
                : '1px solid #e2e8f0',
              color: activeCategory === cat.id ? '#fff' : '#64748b',
              fontSize: isDesktop ? 14 : 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== cat.id) {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== cat.id) {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#e2e8f0';
              }
            }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Destinations Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
        gap: isDesktop ? 20 : 14,
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {getFilteredDestinations().map((dest, index) => {

          

          
          return (
          <div
            key={dest.id}
            role="button"
            tabIndex={0}
            onClick={() => handleDestinationClick(dest)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDestinationClick(dest);
              }
            }}
            onMouseEnter={() => setHoveredDestId(dest.id)}
            onMouseLeave={() => setHoveredDestId(null)}
            style={{
              padding: isDesktop ? '24px 20px' : '20px 16px',
              borderRadius: 12,
              background: '#ffffff',
              border: `1px solid ${hoveredDestId === dest.id ? '#cbd5e1' : '#e2e8f0'}`,
              boxShadow: hoveredDestId === dest.id ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
              color: '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.25s ease-out',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              transform: hoveredDestId === dest.id ? 'translateY(-2px)' : 'translateY(0)',
              outline: 'none',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: isDesktop ? 40 : 36 }}>{dest.emoji}</div>
            <div>
              <div style={{ 
                fontSize: isDesktop ? 16 : 15, 
                fontWeight: 700, 
                marginBottom: 4,
                color: '#0f172a'
              }}>
                {dest.name}
              </div>
              <div style={{ 
                fontSize: isDesktop ? 12 : 11, 
                color: '#94a3b8',
                fontWeight: 500,
                marginBottom: 8
              }}>
                {dest.subtitle}
              </div>
              <div style={{ 
                fontSize: isDesktop ? 11 : 10, 
                color: '#cbd5e1',
                fontWeight: 500
              }}>
                {dest.country}
              </div>
            </div>
            
            {/* CTA text - appears on hover */}
            {hoveredDestId === dest.id && (
              <div style={{
                fontSize: isDesktop ? 12 : 11,
                fontWeight: 600,
                color: '#0f172a',
                marginTop: 4,
                opacity: 1,
                animation: 'slideUp 0.3s ease'
              }}>
                Click to plan →
              </div>
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}

export default ExplorePage;
