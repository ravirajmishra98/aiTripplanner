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
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          color: 'var(--text)', 
          fontSize: isDesktop ? 36 : 28, 
          fontWeight: 800, 
          marginBottom: 12,
          letterSpacing: '-0.8px'
        }}>
          Explore Destinations
        </h1>
        <p style={{ 
          color: '#334155', 
          fontSize: isDesktop ? 16 : 15, 
          lineHeight: 1.5,
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          Discover amazing places to visit. Find inspiration for your next adventure.
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
        flexWrap: 'wrap'
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: isDesktop ? '12px 24px' : '10px 18px',
              borderRadius: 10,
              background: activeCategory === cat.id 
                ? 'linear-gradient(135deg, #1976d2, #2196f3)' 
                : 'rgba(255,255,255,0.08)',
              border: activeCategory === cat.id 
                ? '1px solid rgba(25, 118, 210, 0.5)' 
                : '1px solid rgba(255,255,255,0.12)',
              color: activeCategory === cat.id ? '#fff' : '#b8c5d6',
              fontSize: isDesktop ? 14 : 13,
              fontWeight: activeCategory === cat.id ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== cat.id) {
                e.target.style.background = 'rgba(255,255,255,0.12)';
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== cat.id) {
                e.target.style.background = 'rgba(255,255,255,0.08)';
                e.target.style.borderColor = 'rgba(255,255,255,0.12)';
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
          const gradients = [
            'linear-gradient(135deg, rgba(191, 219, 254, 0.75), rgba(219, 234, 254, 0.95))',
            'linear-gradient(135deg, rgba(254, 205, 211, 0.75), rgba(254, 226, 226, 0.95))',
            'linear-gradient(135deg, rgba(187, 247, 208, 0.75), rgba(220, 252, 231, 0.95))',
            'linear-gradient(135deg, rgba(254, 215, 170, 0.75), rgba(254, 243, 199, 0.95))',
            'linear-gradient(135deg, rgba(221, 214, 254, 0.75), rgba(243, 232, 255, 0.95))',
            'linear-gradient(135deg, rgba(186, 230, 253, 0.75), rgba(224, 242, 254, 0.95))',
            'linear-gradient(135deg, rgba(251, 207, 232, 0.75), rgba(252, 231, 243, 0.95))',
            'linear-gradient(135deg, rgba(217, 249, 157, 0.75), rgba(236, 252, 203, 0.95))',
            'linear-gradient(135deg, rgba(191, 219, 254, 0.75), rgba(219, 234, 254, 0.95))',
            'linear-gradient(135deg, rgba(254, 205, 211, 0.75), rgba(254, 226, 226, 0.95))',
            'linear-gradient(135deg, rgba(187, 247, 208, 0.75), rgba(220, 252, 231, 0.95))',
            'linear-gradient(135deg, rgba(221, 214, 254, 0.75), rgba(243, 232, 255, 0.95))'
          ];
          
          const borders = [
            'rgba(25, 118, 210, 0.2)',
            'rgba(244, 63, 94, 0.2)',
            'rgba(34, 197, 94, 0.2)',
            'rgba(249, 115, 22, 0.2)',
            'rgba(168, 85, 247, 0.2)',
            'rgba(3, 155, 229, 0.2)',
            'rgba(236, 72, 153, 0.2)',
            'rgba(101, 163, 13, 0.2)',
            'rgba(25, 118, 210, 0.2)',
            'rgba(244, 63, 94, 0.2)',
            'rgba(34, 197, 94, 0.2)',
            'rgba(168, 85, 247, 0.2)'
          ];
          
          const currentGradient = gradients[index % gradients.length];
          const currentBorder = borders[index % borders.length];
          
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
              borderRadius: 14,
              background: currentGradient,
              border: `1px solid ${currentBorder}`,
              color: '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              boxShadow: hoveredDestId === dest.id 
                ? `0 12px 24px ${currentBorder.replace('0.2', '0.3')}`
                : `0 3px 10px ${currentBorder.replace('0.2', '0.08')}`,
              transform: hoveredDestId === dest.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              outline: 'none',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: isDesktop ? 40 : 36 }}>{dest.emoji}</div>
            <div>
              <div style={{ 
                fontSize: isDesktop ? 16 : 15, 
                fontWeight: 700, 
                marginBottom: 2,
                color: '#0f172a'
              }}>
                {dest.name}
              </div>
              <div style={{ 
                fontSize: isDesktop ? 12 : 11, 
                color: '#64748b',
                fontWeight: 500,
                marginBottom: 4
              }}>
                {dest.country}
              </div>
              <div style={{ 
                fontSize: isDesktop ? 13 : 12, 
                color: '#334155',
                fontWeight: 500,
                marginBottom: hoveredDestId === dest.id ? 8 : 0,
                transition: 'all 0.25s ease'
              }}>
                {dest.subtitle}
              </div>
            </div>
            
            {/* CTA text - appears on hover */}
            {hoveredDestId === dest.id && (
              <div style={{
                fontSize: isDesktop ? 14 : 13,
                fontWeight: 600,
                color: '#1976d2',
                marginTop: 4,
                opacity: 1,
                animation: 'slideUp 0.3s ease'
              }}>
                Plan trip →
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
