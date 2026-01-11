import React, { useState, useEffect, useRef } from 'react';
import { getRestaurantRecommendations } from '../services/aiService';
import { getImageUrl } from '../services/imageService';

function FoodPage({ isDesktop }) {
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [dietType, setDietType] = useState('any');
  const [cuisineType, setCuisineType] = useState('all');
  const [timeOfDay, setTimeOfDay] = useState('all');
  const [budget, setBudget] = useState('all');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restaurantImages, setRestaurantImages] = useState({});
  const [showMaps, setShowMaps] = useState(false);
  const [heroUrl, setHeroUrl] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Random food hero image on mount
  useEffect(() => {
    const randomFoods = ['Vada Pav', 'Pani Puri', 'Biryani', 'Dosa', 'Samosa', 'Butter Chicken', 'Tandoori', 'Naan', 'Kebab', 'Street Food'];
    const randomFood = randomFoods[Math.floor(Math.random() * randomFoods.length)];
    getImageUrl({ category: 'food', foodName: randomFood }).then(url => setHeroUrl(url)).catch(() => {});
  }, []);

  // Popular cities for autofill
  const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Goa'
  ];

  // Auto-detect location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocode to get city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
            if (detectedCity) {
              setCity(detectedCity);
              setArea(data.address?.suburb || data.address?.neighbourhood || '');
            }
          } catch (error) {
            console.warn('Could not detect city from location');
          }
          setDetectingLocation(false);
        },
        () => {
          setDetectingLocation(false);
        }
      );
    }
  }, []);

  // Initialize map when shown
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current && window.L) {
      const initialLat = userLocation?.lat || 20.5937;
      const initialLng = userLocation?.lng || 78.9629;
      
      // Create map
      const map = window.L.map(mapRef.current).setView([initialLat, initialLng], 13);
      
      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Add marker
      const marker = window.L.marker([initialLat, initialLng], {
        draggable: true
      }).addTo(map);
      
      markerRef.current = marker;
      mapInstanceRef.current = map;
      
      // Handle marker drag
      marker.on('dragend', async function(e) {
        const position = marker.getLatLng();
        await updateLocationFromCoords(position.lat, position.lng);
      });
      
      // Handle map click
      map.on('click', async function(e) {
        marker.setLatLng(e.latlng);
        await updateLocationFromCoords(e.latlng.lat, e.latlng.lng);
      });
    }
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap]);

  const updateLocationFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
      if (detectedCity) {
        setCity(detectedCity);
        setArea(data.address?.suburb || data.address?.neighbourhood || '');
      }
      setUserLocation({ lat, lng });
    } catch (error) {
      console.warn('Could not detect city from location');
    }
  };

  const fetchRestaurantImage = async (restaurant, idx) => {
    const primaryFood = restaurant?.mustTry?.[0] || restaurant?.category || restaurant?.name || 'food';
    const url = await getImageUrl({ foodName: primaryFood, category: 'food' });
    return url;
  };

  const loadImagesForRestaurants = async (restaurantList) => {
    if (!restaurantList || restaurantList.length === 0) return;
    const imagePromises = restaurantList.map(async (restaurant, idx) => {
      const imageUrl = await fetchRestaurantImage(restaurant, idx);
      return { idx, imageUrl };
    });
    
    const images = await Promise.all(imagePromises);
    const imageMap = {};
    images.forEach(({ idx, imageUrl }) => {
      if (imageUrl) imageMap[idx] = imageUrl;
    });
    
    setRestaurantImages(prev => ({ ...prev, ...imageMap }));
  };

  // Initialize mini maps for restaurant cards
  useEffect(() => {
    if (restaurants.length > 0 && window.L && showMaps) {
      restaurants.forEach((restaurant, idx) => {
        const mapId = `restaurant-map-${idx}`;
        const mapElement = document.getElementById(mapId);
        
        if (mapElement && !mapElement._leaflet_id) {
          // Use city location as base, offset slightly for each restaurant
          const baseLat = userLocation?.lat || 20.5937;
          const baseLng = userLocation?.lng || 78.9629;
          
          // Create small random offset based on index for visual variety
          const latOffset = (Math.sin(idx) * 0.02);
          const lngOffset = (Math.cos(idx) * 0.02);
          
          const map = window.L.map(mapId, {
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomControl: false,
            attributionControl: false
          }).setView([baseLat + latOffset, baseLng + lngOffset], 14);
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);
          
          // Add marker
          window.L.marker([baseLat + latOffset, baseLng + lngOffset]).addTo(map);
        }
      });
    }
  }, [restaurants, userLocation, showMaps]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setSearched(true);
    
    const result = await getRestaurantRecommendations({
      city: city.trim(),
      area: area.trim(),
      radiusKm,
      preferences: {
        dietType,
        cuisineType,
        timeOfDay,
        budget
      }
    });

    if (result && result.restaurants) {
      setRestaurants(result.restaurants);
      loadImagesForRestaurants(result.restaurants);
    } else {
      setRestaurants([]);
      setRestaurantImages({});
    }
    
    setLoading(false);
  };

  const openInMaps = (restaurant) => {
    const query = encodeURIComponent(`${restaurant.name}, ${area || city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const loadMoreRestaurants = async () => {
    if (loadingMore || !city.trim()) return;

    setLoadingMore(true);
    
    const result = await getRestaurantRecommendations({
      city: city.trim(),
      area: area.trim(),
      radiusKm,
      preferences: {
        dietType,
        cuisineType,
        timeOfDay,
        budget
      }
    });

    if (result && result.restaurants) {
      // Append new results to existing ones
      const startIdx = restaurants.length;
      setRestaurants(prev => [...prev, ...result.restaurants]);

      // Load images for new restaurants with correct index offset
      const withOffset = result.restaurants.map((r, i) => ({ ...r, idx: startIdx + i }));
      const imagePromises = withOffset.map(async (restaurant) => {
        const imageUrl = await fetchRestaurantImage(restaurant, restaurant.idx);
        return { idx: restaurant.idx, imageUrl };
      });
      const images = await Promise.all(imagePromises);
      const map = {};
      images.forEach(({ idx, imageUrl }) => {
        if (imageUrl) map[idx] = imageUrl;
      });
      setRestaurantImages(prev => ({ ...prev, ...map }));
    }
    
    setLoadingMore(false);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Scrollable wrapper */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Hero background */}
      <div style={{
        position: 'relative',
        backgroundImage: heroUrl ? `url(${heroUrl})` : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff' }}>
          <h1 style={{ fontSize: isDesktop ? 42 : 32, fontWeight: 800, marginBottom: 0, letterSpacing: '-1px' }}>Food & Restaurants</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isDesktop ? '40px 40px' : '24px 20px', flex: 1, animation: 'fadeIn 0.4s ease-in-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 40, maxWidth: 900, width: '100%' }}>
        <p style={{
          color: '#94a3b8',
          fontSize: isDesktop ? 15 : 14
        }}>
          Discover iconic local food and must-try dishes near you
        </p>
      </div>

      {/* Search Form Container */}
      <div style={{
        maxWidth: 900,
        width: '100%'
      }}>
      
      {/* Map Toggle Button */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          style={{
            padding: '8px 14px',
            background: showMap ? '#0f172a' : '#ffffff',
            color: showMap ? '#ffffff' : '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          onMouseEnter={(e) => {
            if (!showMap) {
              e.currentTarget.style.borderColor = '#0f172a';
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
          onMouseLeave={(e) => {
            if (!showMap) {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#ffffff';
            }
          }}
        >
          🗺️ {showMap ? 'Hide Map' : 'Pick Location from Map'}
        </button>
        {detectingLocation && (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            📍 Detecting location...
          </span>
        )}
      </div>

      {/* Map Container */}
      {showMap && (
        <div style={{
          width: '100%',
          height: 400,
          marginBottom: 20,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'relative'
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 11,
            color: '#64748b',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}>
            💡 Click or drag marker to select location
          </div>
        </div>
      )}
      
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{
        width: '100%',
        marginBottom: 40,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Inputs Row */}
        <div style={{
          padding: isDesktop ? '16px 20px' : '12px 16px',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(5, 1fr)' : '1fr',
          gap: 8,
          alignItems: 'end',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* City */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              📍 City
            </label>
            <input
              type="text"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              list="cities"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                transition: 'all 0.2s',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
            <datalist id="cities">
              {popularCities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Area */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              🗺️ Area
            </label>
            <input
              type="text"
              placeholder="Neighborhood"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                background: '#ffffff',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Radius */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              📏 Radius
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
            </select>
          </div>

          {/* Diet */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              🥗 Diet
            </label>
            <select
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="any">Any</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Veg</option>
            </select>
          </div>

          {/* Cuisine */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              🍴 Cuisine
            </label>
            <select
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 11px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all">All</option>
              <option value="indian">Indian</option>
              <option value="chinese">Chinese</option>
              <option value="italian">Italian</option>
              <option value="continental">Continental</option>
              <option value="street-food">Street Food</option>
            </select>
          </div>
        </div>

        {/* Second Row - Time, Budget, Button */}
        <div style={{
          padding: isDesktop ? '12px 20px' : '12px 16px',
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1fr 1.5fr' : '1fr',
          gap: 8,
          alignItems: 'end'
        }}>
          {/* Time */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              🕐 Time
            </label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 11px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all">Any Time</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>

          {/* Budget */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              💰 Budget
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 11px',
                borderRadius: 5,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0f172a';
                e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all">All</option>
              <option value="₹">Budget</option>
              <option value="₹₹">Mid-range</option>
              <option value="₹₹₹">Premium</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading || !city.trim()}
            style={{
              padding: '8px 14px',
              background: loading || !city.trim() ? '#cbd5e1' : '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              cursor: loading || !city.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              height: 'fit-content',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!loading && city.trim()) {
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? '🔍 Searching...' : '🔍 Find'}
          </button>
        </div>
      </form>
      </div>

      {/* Results */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: '#64748b',
          fontSize: 15
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
          Finding the best local spots...
        </div>
      )}

      {!loading && searched && restaurants.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: '#64748b',
          fontSize: 15
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          No restaurants found. Try adjusting your filters.
        </div>
      )}

      {!loading && restaurants.length > 0 && (
        <>
          <div style={{
            color: '#0f172a',
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 16
          }}>
            {restaurants.length} restaurants found

                    {/* Toggle between Map/Image view */}
                    <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setShowMaps(false)}
                        style={{
                          padding: '6px 12px',
                          background: !showMaps ? '#0f172a' : '#ffffff',
                          color: !showMaps ? '#ffffff' : '#0f172a',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        🍽️ Food Images
                      </button>
                      <button
                        onClick={() => setShowMaps(true)}
                        style={{
                          padding: '6px 12px',
                          background: showMaps ? '#0f172a' : '#ffffff',
                          color: showMaps ? '#ffffff' : '#0f172a',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        🗺️ Location Maps
                      </button>
                    </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(340px, 1fr))' : '1fr',
            gap: 20
          }}>
            {restaurants.map((restaurant, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: 12,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  transition: 'all 0.25s ease-out',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Restaurant Image or Map */}
                {showMaps ? (
                  <div 
                    id={`restaurant-map-${idx}`}
                    style={{
                      width: '100%',
                      height: 180,
                      position: 'relative',
                      background: '#f1f5f9'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      padding: '4px 10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      zIndex: 1000
                    }}>
                      📍 {restaurant.distanceKm} km away
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: 180,
                    background: restaurantImages[idx] ? `url(${restaurantImages[idx]}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!restaurantImages[idx] && <div style={{ fontSize: 48 }}>🍽️</div>}
                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      padding: '4px 10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {restaurant.category}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: isDesktop ? 24 : 20 }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <h3 style={{
                    color: '#0f172a',
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 0,
                    letterSpacing: '-0.3px',
                    flex: 1
                  }}>
                    {restaurant.name}
                  </h3>
                  <div style={{
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 500,
                    marginLeft: 12
                  }}>
                    {restaurant.distanceKm} km
                  </div>
                </div>

                {/* Category and Budget */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12
                }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {restaurant.category}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {restaurant.budget}
                  </span>
                </div>

                {/* Famous For */}
                <p style={{
                  color: '#64748b',
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 16
                }}>
                  {restaurant.famousFor}
                </p>

                {/* Must Try Dishes */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    color: '#0f172a',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 8
                  }}>
                    Must Try
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6
                  }}>
                    {restaurant.mustTry.map((dish, dishIdx) => (
                      <span
                        key={dishIdx}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: '#e0e7f1',
                          color: '#0f172a',
                          fontSize: 13,
                          fontWeight: 500
                        }}
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Best Time */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    🕐 {restaurant.bestTime}
                  </div>
                  
                  <button
                    onClick={() => openInMaps(restaurant)}
                    style={{
                      padding: '6px 12px',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1e293b';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0f172a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    📍 Open in Maps
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 32
          }}>
            <button
              onClick={loadMoreRestaurants}
              disabled={loadingMore}
              style={{
                padding: '12px 24px',
                background: loadingMore ? '#cbd5e1' : '#ffffff',
                color: loadingMore ? '#64748b' : '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.borderColor = '#0f172a';
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {loadingMore ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Loading...
                </>
              ) : (
                <>
                  ➕ Load More
                </>
              )}
            </button>
          </div>
        </>
      )}
      </div>
      </div>
    </div>
  );
}

export default FoodPage;
