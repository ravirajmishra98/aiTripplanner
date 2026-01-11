import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navigation from './components/Navigation';
import AssistantDrawer from './components/AssistantDrawer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import MyTripsPage from './pages/MyTripsPage';
import TripPlanPage from './pages/TripPlanPage';
import FoodPage from './pages/FoodPage';
import MoodGuidePage from './pages/MoodGuidePage';
import RoadSensePage from './pages/RoadSensePage';
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
  
  // Assistant conversation state for building trip info
  const [assistantContext, setAssistantContext] = useState({
    step: 'destination', // destination, source, days, budget, tripType
    collectedInfo: {
      destination: '',
      source: '',
      days: '',
      budget: 'mid-range',
      tripType: 'solo'
    }
  });

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
    setBotTyping(true);

    let botMsg;
    const typingDelay = 400 + Math.floor(Math.random() * 301);

    try {
      // If no plan exists, gather info step by step
      if (!lastPlan) {
        const { createTripPlan } = await import('./utils/tripPlanner');
        
        // Check if this is a greeting
        const greetings = ['hi', 'hello', 'hey', 'hola', 'namaste', 'howdy'];
        const isGreeting = greetings.some(g => trimmed.toLowerCase().includes(g));
        
        // If it's a greeting, acknowledge and ask for destination
        if (isGreeting && assistantContext.step === 'destination') {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'Hello! I\'d love to help you plan your trip. Where would you like to travel to? (Destination city)'
          };
        } else {
          // Process as trip data
          let updatedContext = { ...assistantContext };
          let questionToAsk = null;
          let readyToCreatePlan = false;

          // Step 1: Get destination
          if (assistantContext.step === 'destination') {
            updatedContext.collectedInfo.destination = trimmed;
            updatedContext.step = 'source';
            questionToAsk = 'Where are you traveling from? (Source city)';
          }
          // Step 2: Get source
          else if (assistantContext.step === 'source') {
            updatedContext.collectedInfo.source = trimmed;
            updatedContext.step = 'days';
            questionToAsk = 'How many days do you want to travel for?';
          }
          // Step 3: Get number of days
          else if (assistantContext.step === 'days') {
            updatedContext.collectedInfo.days = trimmed;
            updatedContext.step = 'completed';
            readyToCreatePlan = true;
          }

          // Update context state
          setAssistantContext(updatedContext);

          if (readyToCreatePlan) {
            // All info collected - create the plan
            const fullInput = `${updatedContext.collectedInfo.days} days from ${updatedContext.collectedInfo.source} to ${updatedContext.collectedInfo.destination}`;
            const result = createTripPlan(fullInput, language);
            
            if (result.plan) {
              const { parsed } = result.plan;
              setLastPlan(result.plan);
              setTripContext({
                from: parsed?.sourceCity || updatedContext.collectedInfo.source,
                to: parsed?.destinationCity || updatedContext.collectedInfo.destination,
                days: parsed?.numberOfDays || updatedContext.collectedInfo.days,
                pace: parsed?.travelType || 'Leisure'
              });
              
              botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `Perfect! I've created a trip plan for you:\n\n📍 From: ${parsed?.sourceCity || updatedContext.collectedInfo.source}\n📍 To: ${parsed?.destinationCity || updatedContext.collectedInfo.destination}\n📅 Days: ${parsed?.numberOfDays || updatedContext.collectedInfo.days}\n🎯 Type: ${parsed?.travelType || 'Leisure'}\n\nNavigating you to the trip plan page...`
              };
            } else {
              botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `Great! I've noted your trip: ${updatedContext.collectedInfo.days} days from ${updatedContext.collectedInfo.source} to ${updatedContext.collectedInfo.destination}. Let me create your itinerary...`
              };
            }
          } else {
            // Ask the next question
            botMsg = {
              id: Date.now() + 1,
              sender: 'bot',
              text: questionToAsk
            };
          }
        }
      } else {
        // Plan exists - provide contextual responses about the current plan
        const { explainTripPlanWithAI } = await import('./services/aiService');
        const explanations = await explainTripPlanWithAI(lastPlan);
        
        // Provide relevant response based on user query
        if (trimmed.toLowerCase().includes('budget') || trimmed.toLowerCase().includes('price') || trimmed.toLowerCase().includes('cost')) {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: `For your ${tripContext?.days}-day trip to ${tripContext?.to}:\n\n${explanations?.[0] || 'Budget information would be calculated based on your selected accommodations and activities.'}`
          };
        } else if (trimmed.toLowerCase().includes('what') || trimmed.toLowerCase().includes('activity') || trimmed.toLowerCase().includes('do')) {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Here's what you can do in ${tripContext?.to}:\n\n${explanations?.[1] || 'Check your itinerary for day-by-day activities.'}`
          };
        } else if (trimmed.toLowerCase().includes('food') || trimmed.toLowerCase().includes('eat') || trimmed.toLowerCase().includes('restaurant')) {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: `${tripContext?.to} has amazing food! Check the Food & Restaurants page for local recommendations near your destination.`
          };
        } else {
          botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Regarding your trip to ${tripContext?.to} (${tripContext?.days} days):\n\n${explanations?.[0] || 'I can help explain your itinerary, suggest activities, or answer questions about your trip. What would you like to know?'}`
          };
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I encountered an error processing your request. Please try again.'
      };
    }

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
              path="/food" 
              element={<FoodPage isDesktop={isDesktop} />} 
            />
            <Route 
              path="/mood-guide" 
              element={<MoodGuidePage isDesktop={isDesktop} tripContext={tripContext} />} 
            />
            <Route 
              path="/road-sense" 
              element={<RoadSensePage isDesktop={isDesktop} />} 
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

