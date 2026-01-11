import React, { useState, useEffect } from 'react';
import suggestMoodGuide from '../services/moodGuideAI';
import { getImageUrl } from '../services/imageService';

function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: selected ? '1px solid #0f172a' : '1px solid #cbd5e1',
        background: selected ? '#e0e7f1' : '#ffffff',
        color: selected ? '#0f172a' : '#334155',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        marginRight: 10,
        marginBottom: 10
      }}
    >
      {label}
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}>
      {title && <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

export default function MoodGuidePage({ isDesktop, tripContext }) {
  const [mood, setMood] = useState('neutral');
  const [energy, setEnergy] = useState('medium');
  const [time, setTime] = useState('1–2 hours');
  const [budget, setBudget] = useState('₹₹');
  const [locationChoice, setLocationChoice] = useState('hotel'); // 'current' | 'hotel'
  const [coords, setCoords] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [heroUrl, setHeroUrl] = useState('');
  const [localTimeInfo, setLocalTimeInfo] = useState({ label: 'Unknown', hour: null, timeOfDay: 'unknown', isNight: false });

  const city = tripContext?.to || '';
  const area = tripContext?.hotelArea?.area || '';

  // Lightweight list: India has one timezone (Asia/Kolkata)
  const INDIAN_CITIES = ['Mumbai','Pune','Delhi','Bengaluru','Bangalore','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Goa','Agra','Varanasi','Surat','Nagpur','Indore','Bhopal','Lucknow','Patna','Chandigarh','Kochi','Coimbatore','Madurai','Mysuru','Mysore'];

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setCoords(null);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Fetch hero image for current mood/time/city
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cityName = city || '';
      try {
        const url = await getImageUrl({ category: 'mood', moodName: mood, timeOfDay: localTimeInfo.timeOfDay, cityName });
        if (mounted) setHeroUrl(url);
      } catch {
        // leave fallback
      }
    })();
    return () => { mounted = false; };
  }, [city, mood, localTimeInfo.timeOfDay]);

  // Derive local time of selected place (simple, safe heuristics)
  useEffect(() => {
    const now = new Date();
    let hourStr = null;
    let label = 'Unknown';
    let isNight = false;

    // If using current location, trust device local time
    if (locationChoice === 'current' && coords) {
      hourStr = now.toLocaleString('en-US', { hour: '2-digit', hour12: false, minute: '2-digit' });
      label = `Local time: ${hourStr}`;
      const h = parseInt(hourStr.split(':')[0], 10);
      isNight = h >= 20 || h < 6;
      setLocalTimeInfo({ label, hour: h, timeOfDay: isNight ? 'night' : 'day', isNight });
      return;
    }

    // If destination is in India, use Asia/Kolkata
    if (city && INDIAN_CITIES.includes(city.trim())) {
      hourStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false, minute: '2-digit' });
      label = `(${city}) local time: ${hourStr}`;
      const h = parseInt(hourStr.split(':')[0], 10);
      isNight = h >= 20 || h < 6;
      setLocalTimeInfo({ label, hour: h, timeOfDay: isNight ? 'night' : 'day', isNight });
      return;
    }

    // Unknown timezone
    setLocalTimeInfo({ label: 'Local time unknown (using safe defaults)', hour: null, timeOfDay: 'unknown', isNight: false });
  }, [locationChoice, coords, city]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const useCity = locationChoice === 'hotel' ? city : city; // fallback city if unknown
      const useArea = locationChoice === 'hotel' ? area : '';
      const useCoords = locationChoice === 'current' ? coords : null;
      const data = await suggestMoodGuide({ mood, energy, time, budget, city: useCity, area: useArea, coords: useCoords, timeOfDay: localTimeInfo.timeOfDay });
      setResult(data);
    } catch (e) {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      width: '100%',
      background: 'var(--app-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto'
    }}>
      {/* Hero background */}
      <div style={{
        position: 'relative',
        backgroundImage: heroUrl ? `url(${heroUrl})` : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexShrink: 0
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.45))' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: isDesktop ? 40 : 28, fontWeight: 800, letterSpacing: '-0.5px' }}>🧭 Mood-Based Travel Guide</div>
          <div style={{ marginTop: 8, color: '#e2e8f0' }}>Practical, mood-aligned suggestions for where you are.</div>
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 900,
        padding: isDesktop ? '24px 32px' : '16px 16px'
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: 8
        }}>Mood-Based Travel Guide</div>
        <div style={{ color: '#64748b', marginBottom: 16 }}>Decide what to do right now based on how you feel.</div>

        <Card title="1. Mood">
          {[
            { key: 'sad', label: '😔 sad' },
            { key: 'neutral', label: '🙂 neutral' },
            { key: 'happy', label: '😊 happy' },
            { key: 'tired', label: '😴 tired' },
            { key: 'frustrated', label: '😤 frustrated' },
            { key: 'calm', label: '🧘 calm' }
          ].map(m => (
            <Chip key={m.key} label={m.label} selected={mood===m.key} onClick={() => setMood(m.key)} />
          ))}
        </Card>

        <Card title="2. Energy (optional)">
          {[
            { key: 'low', label: '💤 low' },
            { key: 'medium', label: '⚡ medium' },
            { key: 'high', label: '🔥 high' }
          ].map(e => (
            <Chip key={e.key} label={e.label} selected={energy===e.key} onClick={() => setEnergy(e.key)} />
          ))}
        </Card>

        <Card title="3. Time Available">
          {[
            '⏱️ 30 min','🕒 1–2 hours','🌤️ half day','🌞 full day'
          ].map(t => (
            <Chip key={t} label={t} selected={time===t.replace(/^[^0-9A-Za-z]+\s*/, '')} onClick={() => setTime(t.replace(/^[^0-9A-Za-z]+\s*/, ''))} />
          ))}
        </Card>

        <Card title="4. Budget Comfort">
          {['₹','₹₹','₹₹₹','👜 don’t care'].map(b => (
            <Chip key={b} label={b} selected={budget===b.replace('👜 ','')} onClick={() => setBudget(b.replace('👜 ',''))} />
          ))}
        </Card>

        <Card title="5. Location">
          <div style={{ marginBottom: 8 }}>
            <Chip label="📍 Use current location" selected={locationChoice==='current'} onClick={() => { setLocationChoice('current'); requestCurrentLocation(); }} />
            <Chip label="🏨 Use hotel/destination area" selected={locationChoice==='hotel'} onClick={() => setLocationChoice('hotel')} />
          </div>
          <div style={{ color: '#64748b', fontSize: 13 }}>
            {locationChoice==='current' && (!coords ? 'Location access optional. If unavailable, we use your destination city.' : `Location set: ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`)}
            {locationChoice==='hotel' && (city ? `Using destination: ${city}${area? ' • ' + area : ''}` : 'Destination city not set; will use your current city.')}
          </div>
          <div style={{ color: '#334155', fontSize: 13, marginTop: 8 }}>
            🕰️ {localTimeInfo.label}{localTimeInfo.isNight ? ' • Night-time safety: suggesting indoor or well-lit areas' : ''}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
            }}
          >
            {loading ? 'Generating…' : 'Get Guide'}
          </button>
        </div>

        {result && (
          <Card title="Suggested Plan">
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 12,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: 14, color: '#64748b' }}>Mood</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{result.mood}</div>

                <div style={{ marginTop: 10, fontSize: 14, color: '#64748b' }}>Suggestion Type</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>🧩 {result.suggestionType}</div>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 12,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: 14, color: '#64748b' }}>Primary Suggestion</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>📌 {result.primarySuggestion.experience}</div>
                <div style={{ fontSize: 14, color: '#334155', marginTop: 6 }}>{result.primarySuggestion.place}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Time: {result.primarySuggestion.timeRequired} • Cost: {result.primarySuggestion.costLevel}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 12,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: 14, color: '#64748b' }}>Why it fits</div>
                {result.whyItFits.map((w, i) => (
                  <div key={i} style={{ fontSize: 14, color: '#0f172a', marginTop: 6 }}>• {w}</div>
                ))}
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: 12,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: 14, color: '#64748b' }}>Avoid</div>
                {result.avoid.map((a, i) => (
                  <div key={i} style={{ fontSize: 14, color: '#0f172a', marginTop: 6 }}>• {a}</div>
                ))}
              </div>
            </div>

              <div style={{
              background: '#f1f5f9',
              borderRadius: 10,
              padding: 12,
              border: '1px solid #e2e8f0',
              marginTop: 16
            }}>
              <div style={{ fontSize: 14, color: '#64748b' }}>Backup Option</div>
              <div style={{ fontSize: 14, color: '#0f172a', marginTop: 6 }}>🔄 {result.backupOption}</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
