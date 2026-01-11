import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation({ isDesktop }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinkStyle = (path) => ({
    color: location.pathname === path ? '#0f172a' : '#64748b',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: location.pathname === path ? 600 : 500,
    padding: '8px 0',
    borderRadius: 0,
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'inline-block',
    background: 'transparent',
    borderBottom: location.pathname === path ? '3px solid #0f172a' : '3px solid transparent',
    letterSpacing: '0.2px',
    marginX: 18
  });

  const mobileNavLinkStyle = (path) => ({
    color: location.pathname === path ? '#0f172a' : '#64748b',
    textDecoration: 'none',
    fontSize: 16,
    fontWeight: location.pathname === path ? 600 : 500,
    padding: '14px 20px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    background: location.pathname === path ? '#e0e7f1' : 'transparent',
    borderLeft: location.pathname === path ? '3px solid #0f172a' : '3px solid transparent',
    letterSpacing: '0.2px'
  });

  // Desktop Navigation
  if (isDesktop) {
    return (
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
          <span style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>AI Travel Planner</span>
        </Link>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24
        }}>
          <Link 
            to="/" 
            style={navLinkStyle('/')}
            onMouseEnter={(e) => {
              if (location.pathname !== '/') {
                e.target.style.color = '#0f172a';
                e.target.style.borderBottomColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/') {
                e.target.style.color = '#64748b';
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Home
          </Link>
          
          <Link 
            to="/explore" 
            style={navLinkStyle('/explore')}
            onMouseEnter={(e) => {
              if (location.pathname !== '/explore') {
                e.target.style.color = '#0f172a';
                e.target.style.borderBottomColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/explore') {
                e.target.style.color = '#64748b';
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Explore
          </Link>
          
          <Link 
            to="/food" 
            style={navLinkStyle('/food')}
            onMouseEnter={(e) => {
              if (location.pathname !== '/food') {
                e.target.style.color = '#0f172a';
                e.target.style.borderBottomColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/food') {
                e.target.style.color = '#64748b';
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Food
          </Link>
          
          <Link 
            to="/mood-guide" 
            style={navLinkStyle('/mood-guide')}
            onMouseEnter={(e) => {
              if (location.pathname !== '/mood-guide') {
                e.target.style.color = '#0f172a';
                e.target.style.borderBottomColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/mood-guide') {
                e.target.style.color = '#64748b';
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Mood Guide
          </Link>

          <Link 
            to="/my-trips" 
            style={navLinkStyle('/my-trips')}
            onMouseEnter={(e) => {
              if (location.pathname !== '/my-trips') {
                e.target.style.color = '#0f172a';
                e.target.style.borderBottomColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/my-trips') {
                e.target.style.color = '#64748b';
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            My Trips
          </Link>

          <Link 
            to="/road-sense" 
            style={navLinkStyle('/road-sense')}
            onMouseEnter={(e) => {
              if (location.pathname !== '/road-sense') {
                e.target.style.color = '#0f172a';
                e.target.style.borderBottomColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/road-sense') {
                e.target.style.color = '#64748b';
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Road Sense
          </Link>
        </div>
      </nav>
    );
  }

  // Mobile Side Navigation
  return (
    <>
      {/* Mobile Top Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 100,
        flexShrink: 0
      }}>
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          color: '#0f172a'
        }}>
          <span style={{ fontSize: 24 }}>✈️</span>
        </Link>

        {/* Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#0f172a',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Side Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            top: 48
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Side Navigation */}
      <div style={{
        position: 'fixed',
        top: 48,
        left: 0,
        width: '100%',
        height: 'calc(100% - 48px)',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        zIndex: 50,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0'
        }}>
          <Link 
            to="/" 
            style={mobileNavLinkStyle('/')}
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={(e) => {
              if (location.pathname !== '/') {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🏠</span>
            <span>Home</span>
          </Link>
          
          <Link 
            to="/explore" 
            style={mobileNavLinkStyle('/explore')}
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={(e) => {
              if (location.pathname !== '/explore') {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/explore') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🌍</span>
            <span>Explore</span>
          </Link>
          
          <Link 
            to="/food" 
            style={mobileNavLinkStyle('/food')}
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={(e) => {
              if (location.pathname !== '/food') {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/food') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🍽️</span>
            <span>Food</span>
          </Link>

          <Link 
            to="/mood-guide" 
            style={mobileNavLinkStyle('/mood-guide')}
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={(e) => {
              if (location.pathname !== '/mood-guide') {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/mood-guide') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🧭</span>
            <span>Mood Guide</span>
          </Link>
          
          <Link 
            to="/my-trips" 
            style={mobileNavLinkStyle('/my-trips')}
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={(e) => {
              if (location.pathname !== '/my-trips') {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/my-trips') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🗺️</span>
            <span>My Trips</span>
          </Link>

          <Link 
            to="/road-sense" 
            style={mobileNavLinkStyle('/road-sense')}
            onClick={() => setMobileMenuOpen(false)}
            onMouseEnter={(e) => {
              if (location.pathname !== '/road-sense') {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/road-sense') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 20 }}>🛣️</span>
            <span>Road Sense</span>
          </Link>
        </div>
      </div>
    </>
  );
}

export default Navigation;
