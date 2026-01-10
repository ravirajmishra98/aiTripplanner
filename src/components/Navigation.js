import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation({ isDesktop }) {
  const location = useLocation();
  
  const navLinkStyle = (path) => ({
    color: location.pathname === path ? '#0f172a' : '#64748b',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: location.pathname === path ? 600 : 500,
    padding: '10px 18px',
    borderRadius: 8,
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'inline-block',
    background: location.pathname === path ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
    borderBottom: location.pathname === path ? '2px solid #1976d2' : '2px solid transparent',
    letterSpacing: '0.2px'
  });

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isDesktop ? '14px 32px' : '12px 20px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow)',
      zIndex: 50,
      flexShrink: 0,
      position: 'sticky',
      top: 0
    }}>
      {/* Logo */}
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color: '#0f172a',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: 28 }}>✈️</span>
        {isDesktop && (
          <span style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>AI Travel Planner</span>
        )}
      </Link>

      {/* Navigation Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isDesktop ? 6 : 3
      }}>
        <Link 
          to="/" 
          style={navLinkStyle('/')}
          onMouseEnter={(e) => {
            if (location.pathname !== '/') {
              e.target.style.color = '#0f172a';
              e.target.style.background = 'rgba(15, 23, 42, 0.06)';
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/') {
              e.target.style.color = '#64748b';
              e.target.style.background = 'transparent';
            }
          }}
        >
          🏠 Home
        </Link>
        
        <Link 
          to="/explore" 
          style={navLinkStyle('/explore')}
          onMouseEnter={(e) => {
            if (location.pathname !== '/explore') {
              e.target.style.color = '#0f172a';
              e.target.style.background = 'rgba(15, 23, 42, 0.06)';
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/explore') {
              e.target.style.color = '#64748b';
              e.target.style.background = 'transparent';
            }
          }}
        >
          🌍 Explore
        </Link>
        
        <Link 
          to="/my-trips" 
          style={navLinkStyle('/my-trips')}
          onMouseEnter={(e) => {
            if (location.pathname !== '/my-trips') {
              e.target.style.color = '#0f172a';
              e.target.style.background = 'rgba(15, 23, 42, 0.06)';
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/my-trips') {
              e.target.style.color = '#64748b';
              e.target.style.background = 'transparent';
            }
          }}
        >
          🗺️ My Trips
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;
