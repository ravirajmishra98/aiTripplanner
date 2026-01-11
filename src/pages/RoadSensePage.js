import React, { useState } from 'react';
import RouteFlow from '../components/RouteFlow';
import judgeRoadRoutes from '../services/roadSenseAI';

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

export default function RoadSensePage({ isDesktop }) {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [experienceLevel, setExperienceLevel] = useState('Comfortable');
  const [priorities, setPriorities] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Derive concise route names from summaries (first clause, trimmed)
  const summarize = (s) => {
    if (!s || typeof s !== 'string') return '';
    const first = s.split(/[.;\n]/)[0] || s;
    const clean = first.replace(/^(Take|Use|Follow|Stick to|Choose)\s+/i, '').trim();
    return clean.length > 36 ? clean.slice(0, 36) + '…' : clean;
  };

  const togglePriority = (p) => {
    setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleJudge = async () => {
    setLoading(true);
    try {
      const data = await judgeRoadRoutes({ start, destination, vehicleType, experienceLevel, priorities });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, width: '100%', background: 'var(--app-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 900, padding: isDesktop ? '24px 32px' : '16px 16px' }}>
        {/* Title */}
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Road Sense</div>
        <div style={{ color: '#64748b', marginBottom: 16 }}>Choose the safer, smoother route — not maps or directions.</div>

        {/* Visual Route Flow (hero) */}
        <RouteFlow
          width={900}
          height={260}
          startLabel={start || 'Start'}
          endLabel={destination || 'Destination'}
          stops={result?.recommendedRoute?.stops || []}
          recommendedLabels={(result?.recommendedRoute?.whyRecommended || result?.recommendedRoute?.bestFor || []).slice(0,2)}
          avoidLabels={(result?.avoidRoute?.reason || []).slice(0,2).map(r => r?.toLowerCase().startsWith('avoid') ? r : `Avoid: ${r}`)}
          greenRouteName={summarize(result?.recommendedRoute?.summary)}
          redRouteName={summarize(result?.avoidRoute?.summary)}
        />

        {/* Inputs */}
        <Card title="Tell us about your ride">
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0,1fr) minmax(0,1fr)' : '1fr', gap: 16, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Start location</div>
              <input
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="e.g., Pune"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 999,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  display: 'block'
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Destination</div>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Goa"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 999,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  display: 'block'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Vehicle type</div>
            {['Bike','Car','SUV'].map(v => (
              <Chip key={v} label={v} selected={vehicleType===v} onClick={() => setVehicleType(v)} />
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Experience</div>
            {['Beginner','Comfortable','Expert'].map(x => (
              <Chip key={x} label={x} selected={experienceLevel===x} onClick={() => setExperienceLevel(x)} />
            ))}
          </div>

          {/* Collapsible preferences */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: '#334155', fontSize: 14 }}>More preferences (optional)</summary>
            <div style={{ marginTop: 8 }}>
              {['Safe roads','Smooth surface','Scenic','Avoid bad roads','Monsoon friendly'].map(p => (
                <Chip key={p} label={p} selected={priorities.includes(p)} onClick={() => togglePriority(p)} />
              ))}
            </div>
          </details>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              onClick={handleJudge}
              disabled={loading}
              style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '12px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600, boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)' }}
            >
              {loading ? 'Evaluating…' : 'Which road should I take?'}
            </button>
          </div>
        </Card>

        {/* Recommendation Summary */}
        {result && (
          <Card title={null}>
            {/* Confidence meter */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <span title="Based on road conditions, rider experience, and vehicle type" style={{ background: '#e2e8f0', color: '#0f172a', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>
                Confidence: {result.confidence}
              </span>
            </div>

            {/* Best route (green) */}
            <div style={{ background: '#f6fffa', border: '1px solid #dcfce7', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>Best route for you</div>
              <div style={{ fontSize: 15, color: '#064e3b', marginTop: 6 }}>{result.recommendedRoute.summary}</div>
              <div style={{ marginTop: 8 }}>
                {(result.recommendedRoute.whyRecommended || []).slice(0,3).map((w, i) => (
                  <div key={i} style={{ fontSize: 14, color: '#065f46', marginTop: 6 }}>✅ {w}</div>
                ))}
              </div>
            </div>

            {/* Route to avoid (red) */}
            <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#7f1d1d' }}>Route to avoid</div>
              <div style={{ fontSize: 15, color: '#7f1d1d', marginTop: 6 }}>{result.avoidRoute.summary}</div>
              <div style={{ marginTop: 8 }}>
                {(result.avoidRoute.reason || []).slice(0,3).map((r, i) => (
                  <div key={i} style={{ fontSize: 14, color: '#7f1d1d', marginTop: 6 }}>⚠️ {r}</div>
                ))}
              </div>
            </div>

            {/* Personalized insight */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 14, color: '#0f172a' }}>
                🧠 {experienceLevel === 'Beginner' ? 'As a beginner rider, choosing smoother, wider roads reduces fatigue and risk.' : experienceLevel === 'Expert' ? 'As an expert, you can handle moderate sections, but avoid needlessly rough shortcuts.' : 'For a comfortable ride, smoother tarmac and predictable stretches keep fatigue low.'}
              </div>
            </div>
          </Card>
        )}

        {!result && (
          <Card title={null}>
            <div style={{ color: '#64748b', fontSize: 14 }}>Tap “Which road should I take?” to see a decisive recommendation and the route to avoid.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
