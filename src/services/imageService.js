import { getAssetUrl } from '../utils/assetsMap';

const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.REACT_APP_PEXELS_API_KEY;
const PIXABAY_KEY = process.env.REACT_APP_PIXABAY_API_KEY;

const FALLBACK_SVG = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <text x="50%" y="50%" font-size="32" font-family="Arial, sans-serif" fill="#e2e8f0" text-anchor="middle" dy="10">Image coming soon</text>
  </svg>
`);
const FALLBACK_URL = `data:image/svg+xml,${FALLBACK_SVG}`;

const cache = new Map();

function mapMoodToTerms(mood, timeOfDay) {
  const m = (mood || '').toLowerCase();
  const night = timeOfDay === 'night';
  const base = [];
  if (m === 'sad') {
    base.push('calm', 'cozy', 'cafe', 'warm lighting');
  } else if (m === 'neutral') {
    base.push('city walk', 'market', 'promenade');
  } else if (m === 'happy') {
    base.push('lively', 'vibrant', 'boulevard');
  } else if (m === 'tired') {
    base.push('peaceful', 'garden', 'tea lounge');
  } else if (m === 'frustrated') {
    base.push('wide boulevard', 'evening walk', 'street food');
  } else if (m === 'calm') {
    base.push('serene', 'temple', 'courtyard', 'zen garden');
  } else {
    base.push('travel', 'city');
  }
  if (night) {
    base.push('night', 'city lights', 'well lit');
  }
  return base;
}

function buildQuery({ cityName, countryName, foodName, category, moodName, timeOfDay }) {
  const parts = [];
  if (category === 'food') {
    if (foodName) parts.push(foodName);
    parts.push('food', 'street food', 'dish');
  } else if (category === 'mood') {
    const moodTerms = mapMoodToTerms(moodName, timeOfDay);
    parts.push(...moodTerms);
    if (cityName) parts.push(cityName);
    parts.push('travel', 'experience');
  } else {
    if (cityName) parts.push(cityName);
    if (countryName) parts.push(countryName);
    parts.push('skyline', 'landmark', 'travel');
  }
  return parts.filter(Boolean).join(' ');
}

async function fetchUnsplash(query) {
  if (!UNSPLASH_KEY) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&per_page=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const result = data?.results?.[0];
  return result?.urls?.regular || result?.urls?.small || null;
}

async function fetchPexels(query) {
  if (!PEXELS_KEY) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_KEY }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const photo = data?.photos?.[0];
  return photo?.src?.large || photo?.src?.medium || null;
}

async function fetchPixabay(query) {
  if (!PIXABAY_KEY) return null;
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&category=travel`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data?.hits?.[0];
  return hit?.largeImageURL || hit?.webformatURL || null;
}

async function getImageUrl(params) {
  const key = JSON.stringify(params);
  if (cache.has(key)) return cache.get(key);

  const query = buildQuery(params);

  // Prefer local reusable assets when available
  if (params?.category === 'food' && params?.foodName) {
    const local = getAssetUrl('food', params.foodName);
    if (local) {
      cache.set(key, local);
      return local;
    }
  }
  if (params?.category === 'destination' && (params?.cityName || params?.countryName)) {
    const local = getAssetUrl('destination', params?.cityName || params?.countryName);
    if (local) {
      cache.set(key, local);
      return local;
    }
  }

  let imageUrl = null;
  try {
    imageUrl = await fetchUnsplash(query);
    if (!imageUrl) imageUrl = await fetchPexels(query);
    if (!imageUrl) imageUrl = await fetchPixabay(query);
  } catch (err) {
    console.warn('[imageService] image fetch failed', err?.message || err);
  }

  if (!imageUrl) imageUrl = FALLBACK_URL;
  cache.set(key, imageUrl);
  return imageUrl;
}

export { getImageUrl, FALLBACK_URL };
