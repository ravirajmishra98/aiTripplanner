import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navigation from './components/Navigation';
import AssistantDrawer from './components/AssistantDrawer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import MyTripsPage from './pages/MyTripsPage';
import TripPlanPage from './pages/TripPlanPage';
import { createTripPlan } from './utils/tripPlanner';


function App() {
  // Shared state
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Welcome to AI Travel Planner. How can I help you plan your trip today?' }
  ]);
  const [tripContext, setTripContext] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [lastPlan, setLastPlan] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'english');
  const messagesContainerRef = useRef(null);

  // Global body styles
  React.useEffect(() => {
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Detect desktop/mobile screen size
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  // Scroll to bottom on new message or typing state
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const doScroll = () => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } catch (e) {
        el.scrollTop = el.scrollHeight;
      }
    };
    const raf = requestAnimationFrame(doScroll);
    return () => cancelAnimationFrame(raf);
  }, [messages, botTyping]);

  // Handle user sending a message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { id: Date.now(), sender: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let botMsg;

    // Check if a plan exists - assistant only works with existing plans
    if (!lastPlan) {
      botMsg = { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: 'I can help refine your travel plan, but I need an existing plan first. Please go to Home and create a trip plan by selecting an idea or talking to me there.' 
      };
    } else {
      // Plan exists - assistant is in refinement mode
      // For now, acknowledge the request (actual refinement happens via quick action buttons)
      botMsg = { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: 'I can help explain your current plan or refine it. Use the quick action buttons (Budget Friendly, More Relaxed, Add 1 Day) to modify your itinerary, or ask me any questions about your trip.' 
      };
    }

    const typingDelay = 400 + Math.floor(Math.random() * 301);
    setBotTyping(true);
    await new Promise(res => setTimeout(res, typingDelay));
    setMessages(prev => [...prev, botMsg]);
    setBotTyping(false);
    setLoading(false);
  };

  // Handle Enter key in input
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSend();
    }
  };

  // Main layout wrapper
  return (
    <div style={{
      minHeight: '100dvh',
      width: '100vw',
      background: 'var(--app-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      overscrollBehavior: 'none',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'manipulation',
    }}>
      <div style={{
        width: '100%',
        maxWidth: isDesktop ? '1400px' : '100%',
        height: '100dvh',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        overflow: 'hidden',
      }}>
        {/* Main Content Column (left on desktop, full on mobile) */}
        <div style={{
          flex: isDesktop ? '1' : 'unset',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%',
          transition: 'all 0.3s ease'
        }}>
          {/* Top Navigation */}
          <Navigation isDesktop={isDesktop} />

          {/* Page Routes */}
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  isDesktop={isDesktop}
                  loading={loading}
                  setLoading={setLoading}
                  setLastPlan={setLastPlan}
                  setTripContext={setTripContext}
                  setMessages={setMessages}
                  setShowAssistant={setShowAssistant}
                  language={language}
                  setLanguage={setLanguage}
                />
              } 
            />
            <Route 
              path="/explore" 
              element={<ExplorePage isDesktop={isDesktop} />} 
            />
            <Route 
              path="/my-trips" 
              element={
                <MyTripsPage 
                  isDesktop={isDesktop}
                  setLastPlan={setLastPlan}
                  setTripContext={setTripContext}
                />
              } 
            />
            <Route 
              path="/plan" 
              element={
                <TripPlanPage 
                  isDesktop={isDesktop}
                  lastPlan={lastPlan}
                  setLastPlan={setLastPlan}
                  tripContext={tripContext}
                  setTripContext={setTripContext}
                  messages={messages}
                  setMessages={setMessages}
                  setShowAssistant={setShowAssistant}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Assistant Drawer - Global overlay, only on /plan page */}
      </div>

      {/* Global Floating Assistant Drawer - always available when requested */}
      <AssistantDrawer
        isDesktop={isDesktop}
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        messages={messages}
        messagesContainerRef={messagesContainerRef}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onKeyDown={handleInputKeyDown}
        loading={loading}
        hasPlan={!!lastPlan}
      />
    </div>
  );
}

export default App;

