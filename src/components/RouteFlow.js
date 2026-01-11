import React, { useEffect, useRef, useState } from 'react';

/**
 * Visual, abstract route flow (NOT a map)
 * - Vertical layout from start (top) to destination (bottom)
 * - Green solid animated line for recommended route
 * - Red dashed static line slightly offset for avoid route
 * - Stops: small nodes fade in sequentially
 */
export default function RouteFlow({ width = 900, height = 240, startLabel = 'Start', endLabel = 'Destination', stops = [], recommendedLabels = [], avoidLabels = [], greenRouteName = '', redRouteName = '', laneGap = 160, curveSpread = 80 }) {
  const greenPathRef = useRef(null);
  const redPathRef = useRef(null);
  const [animateGreen, setAnimateGreen] = useState(false);
  const [showRed, setShowRed] = useState(false);
  const [stopPositions, setStopPositions] = useState([]);
  const [hoveredStop, setHoveredStop] = useState(null);
  const [greenCallouts, setGreenCallouts] = useState([]);
  const [redCallouts, setRedCallouts] = useState([]);
  const [greenNamePos, setGreenNamePos] = useState(null);
  const [redNamePos, setRedNamePos] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimateGreen(true), 120);
    const r = setTimeout(() => setShowRed(true), 2000);
    return () => { clearTimeout(t); clearTimeout(r); };
  }, []);

  // Compute dynamic positions along the green/red paths
  useEffect(() => {
    const g = greenPathRef.current;
    if (g) {
      const total = g.getTotalLength();
      const count = Array.isArray(stops) ? stops.length : 0;
      const positions = Array.from({ length: count }, (_, i) => {
        const l = (total * (i + 1)) / (count + 1);
        const pt = g.getPointAtLength(l);
        return { x: pt.x, y: pt.y, label: stops[i] };
      });
      setStopPositions(positions);

      const gc = (recommendedLabels || []).slice(0, 2).map((text, idx) => {
        const frac = idx === 0 ? 0.3 : 0.7;
        const p = g.getPointAtLength(total * frac);
        const offsetX = 18;
        const offsetY = idx === 0 ? -16 : 16;
        return { x: p.x + offsetX, y: p.y + offsetY, text };
      });
      setGreenCallouts(gc);
      // Route name near top third
      const namePoint = g.getPointAtLength(total * 0.15);
      setGreenNamePos({ x: namePoint.x + 12, y: namePoint.y - 22 });
    }

    const r = redPathRef.current;
    if (r) {
      const totalR = r.getTotalLength();
      const rc = (avoidLabels || []).slice(0, 2).map((text, idx) => {
        const frac = idx === 0 ? 0.35 : 0.75;
        const p = r.getPointAtLength(totalR * frac);
        const offsetX = 10;
        const offsetY = idx === 0 ? -14 : 14;
        return { x: p.x + offsetX, y: p.y + offsetY, text };
      });
      setRedCallouts(rc);
      // Route name near top third
      const namePointR = r.getPointAtLength(totalR * 0.15);
      setRedNamePos({ x: namePointR.x + 12, y: namePointR.y - 22 });
    }
  }, [stops, recommendedLabels, avoidLabels]);

  // Precompute lane anchors for clearer separation
  const gX = width/2 - laneGap;
  const rX = width/2 + laneGap;
  const c = curveSpread;

  return (
    <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="greenFlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        {/* Recommended route path (smooth vertical curve) */}
        <path
          ref={greenPathRef}
          d={`M ${gX} 40 C ${gX - c/2} ${height/3}, ${gX + c/2} ${(2*height)/3}, ${gX} ${height-40}`}
          stroke="url(#greenFlow)"
          strokeWidth={6}
          fill="none"
          style={{
            strokeDasharray: animateGreen ? '0' : '1000',
            strokeDashoffset: animateGreen ? '0' : '1000',
            transition: 'stroke-dashoffset 1.8s ease, stroke-dasharray 1.8s ease'
          }}
        />

        {/* Green horizontal callouts near the path */}
        {greenCallouts.map((c2, idx) => (
          <g key={`green-callout-${idx}`} style={{ opacity: animateGreen ? 0.95 : 0, transition: `opacity 0.5s ease ${1.0 + idx * 0.15}s` }}>
            <rect x={c2.x - 4} y={c2.y - 14} rx={6} ry={6} width={Math.max(60, c2.text.length * 6.5)} height={22} fill="#ecfdf5" stroke="#34d399" />
            <text x={c2.x + 4} y={c2.y + 2} fill="#065f46" fontSize={12}>{c2.text}</text>
          </g>
        ))}

        {/* Green route name label */}
        {greenRouteName && greenNamePos && (
          <g style={{ opacity: animateGreen ? 0.95 : 0, transition: 'opacity 0.5s ease 0.8s' }}>
            <rect x={greenNamePos.x - 6} y={greenNamePos.y - 14} rx={8} ry={8} width={Math.max(90, greenRouteName.length * 7)} height={24} fill="#e6fffa" stroke="#99f6e4" />
            <text x={greenNamePos.x} y={greenNamePos.y + 3} fill="#0f766e" fontSize={12} fontWeight={600}>{greenRouteName}</text>
          </g>
        )}

        {/* Avoid route (offset, dashed, subtle) fades in after green */}
        <g style={{ opacity: showRed ? 1 : 0, transition: 'opacity 0.6s ease 0.1s' }}>
          <path
            ref={redPathRef}
            d={`M ${rX} 40 C ${rX - c/2} ${height/3}, ${rX + c/2} ${(2*height)/3}, ${rX} ${height-40}`}
            stroke="#ef4444"
            strokeWidth={4}
            fill="none"
            strokeDasharray="8 8"
            opacity={0.45}
          />
          {redCallouts.map((c3, idx) => (
            <g key={`red-callout-${idx}`}>
              <rect x={c3.x - 4} y={c3.y - 14} rx={6} ry={6} width={Math.max(80, c3.text.length * 6.5)} height={22} fill="#fef2f2" stroke="#fecaca" />
              <text x={c3.x + 4} y={c3.y + 2} fill="#7f1d1d" fontSize={12}>{c3.text}</text>
            </g>
          ))}
          {/* Red route name label */}
          {redRouteName && redNamePos && (
            <g>
              <rect x={redNamePos.x - 6} y={redNamePos.y - 14} rx={8} ry={8} width={Math.max(90, redRouteName.length * 7)} height={24} fill="#fff1f2" stroke="#fecdd3" />
              <text x={redNamePos.x} y={redNamePos.y + 3} fill="#be123c" fontSize={12} fontWeight={600}>{redRouteName}</text>
            </g>
          )}
        </g>

        {/* Stops on the recommended route */}
        {stopPositions.map((p, idx) => (
          <g key={`stop-${idx}`} style={{ opacity: animateGreen ? 1 : 0, transition: `opacity 0.4s ease ${1.6 + idx * 0.18}s` }}>
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill="#22c55e"
              stroke="#14532d"
              strokeWidth={2}
              style={{ transformOrigin: `${p.x}px ${p.y}px`, transform: hoveredStop === idx ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s ease' }}
              onMouseEnter={() => setHoveredStop(idx)}
              onMouseLeave={() => setHoveredStop(null)}
            />
            {hoveredStop === idx && p.label && (
              <g>
                <rect x={p.x + 10} y={p.y - 18} rx={6} ry={6} width={Math.max(60, p.label.length * 6.5)} height={22} fill="#ecfdf5" stroke="#bbf7d0" />
                <text x={p.x + 14} y={p.y - 3} fill="#065f46" fontSize={12}>{p.label}</text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
