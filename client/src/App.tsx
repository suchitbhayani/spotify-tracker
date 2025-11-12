import { useState, useEffect } from 'react'
import ArtistCard from "./components/ArtistCard";

interface Artist {
  name: string;
  spotifyId?: string;
  spotifyRank?: number;
  spotifyImageURL?: string;
  available?: boolean;
  matchType?: string;
}

interface AvailabilityResult {
  totalArtists: number;
  availableCount: number;
  unavailableCount: number;
  availableArtists: Artist[];
  unavailableArtists: Artist[];
  canGenerateRecommendations: boolean;
  needsMoreArtists: number;
}

interface RecommendationResult {
  userId: string;
  artistNames: string[];
  recommendations: string[];
  recommendationCount: number;
  algorithm: string;
  createdAt: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [spotifyArtists, setSpotifyArtists] = useState<Artist[]>([]);
  const [availabilityResult] = useState<AvailabilityResult | null>(null);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Dynamic backend URL detection
  const getBackendUrl = () => {
    // Production deployment - ALWAYS use same domain (Railway-safe)
    if (import.meta.env.PROD) {
      // In production, API calls go through the same domain (reverse proxy)
      return window.location.origin; // e.g., https://your-app.com
    }
    
    // Local development (non-Docker) - detect IPv4 vs IPv6
    const currentHost = window.location.hostname;
    if (currentHost === '::1' || currentHost === '[::1]') {
      return 'http://[::1]:8080';
    } else if (currentHost === '127.0.0.1') {
      return 'http://127.0.0.1:8080';
    } else {
      return 'http://localhost:8080';
    }
  };

  const API_BASE = getBackendUrl();

  // Step 1: Authenticate with Spotify
  const handleSpotifyAuth = () => {
    let frontendUrl;
    
    // Production deployment - ALWAYS use same domain (Railway-safe)
    if (import.meta.env.PROD) {
      frontendUrl = window.location.origin; // Same domain
    }
    // Local development (non-Docker) - detect IPv4 vs IPv6
    else {
      const currentHost = window.location.hostname;
      if (currentHost === '::1' || currentHost === '[::1]') {
        frontendUrl = 'http://[::1]:5173';
      } else if (currentHost === '127.0.0.1') {
        frontendUrl = 'http://127.0.0.1:5173';
      } else {
        frontendUrl = 'http://localhost:5173';
      }
    }
    
    const redirectURI = encodeURIComponent(frontendUrl);
    window.location.href = `${API_BASE}/auth/spotify?redirectURI=${redirectURI}`;
  };

  // Step 2: Get top artists from Spotify
  const fetchTopArtists = async () => {
    try {
      console.log('🎵 Fetching top artists from:', `${API_BASE}/api/top_artists`);
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/top_artists`, {
        credentials: 'include',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('🎵 Top artists response status:', response.status, response.statusText);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError);
          const text = await response.text();
          console.error('❌ Response text:', text.substring(0, 200));
          alert('Failed to fetch top artists: Invalid response from server. Please try again.');
          return;
        }
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response received:', text.substring(0, 200));
        alert(`Failed to fetch top artists: Server returned ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          setIsAuthenticated(false);
        }
        return;
      }

      if (response.ok) {
        console.log('✅ Top artists data received:', data);
        
        if (data.artistNames && Array.isArray(data.artistNames) && data.artistNames.length > 0) {
          const artists = data.artistNames.map((name: string, index: number) => ({
            name,
            spotifyImageURL: data.artistImageURLs?.[index] || '',
            spotifyRank: index + 1,
          }));
          console.log(`✅ Setting ${artists.length} artists in state`);
          setSpotifyArtists(artists);
        } else {
          console.warn('⚠️ No artists in response or invalid format');
          console.warn('⚠️ Response data:', data);
          alert('No top artists found. You may need to listen to more music on Spotify first.');
        }
      } else {
        console.error('❌ Failed to fetch top artists:', data);
        const errorMessage = data.error || data.message || 'Unknown error';
        const errorCode = data.code || 'UNKNOWN_ERROR';
        
        if (response.status === 401 || errorCode === 'AUTH_EXPIRED') {
          console.error('❌ 401 Unauthorized - access token may be missing or expired');
          setIsAuthenticated(false);
          alert('Your Spotify session has expired. Please reconnect your account.');
        } else if (response.status === 403 || errorCode === 'INSUFFICIENT_PERMISSIONS') {
          alert('Insufficient permissions. Please reconnect your Spotify account with proper permissions.');
        } else if (response.status === 429 || errorCode === 'RATE_LIMITED') {
          alert('Rate limited by Spotify. Please try again in a few minutes.');
        } else {
          alert(`Failed to fetch top artists: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching top artists:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      alert(`Failed to fetch top artists: ${errorMessage}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Check artist availability and auto-generate if possible
  // const checkArtistAvailability = async (artists: Artist[]) => {
  //   try {
  //   setLoading(true);
  //   const response = await fetch(`${API_BASE}/api/check_artists_availability`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ 
  //       artistNames: artists.map(a => a.name),
  //       userId: 'user123' // In real app, get from auth
  //     }),
  //     credentials: 'include',
  //   });
  //   const data = await response.json();
  //   
  //   if (response.ok) {
  //     if (data.autoGenerated) {
  //       // Auto-generated recommendations - show immediately
  //       setRecommendations(data.recommendations);
  //       setAvailabilityResult({
  //         totalArtists: data.totalArtists,
  //         availableCount: data.availableCount,
  //         unavailableCount: data.unavailableCount,
  //         availableArtists: data.availableArtists,
  //         unavailableArtists: data.unavailableArtists,
  //         canGenerateRecommendations: true,
  //         needsMoreArtists: 0
  //       });
  //     } else {
  //       // Need search interface - show availability and pre-select available artists
  //       setAvailabilityResult(data);
  //       setSelectedArtists(data.availableArtists);
  //     }
  //   } else {
  //     console.error('Failed to check availability:', data.error);
  //   }
  // } catch (error) {
  //   console.error('Error checking availability:', error);
  // } finally {
  //   setLoading(false);
  // }
  // };

  // Step 5: Generate recommendations from manual selection
  const generateRecommendations = async () => {
    if (selectedArtists.length < 5) {
      alert('Please select at least 5 artists');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'user123', // In real app, get from auth
          artistNames: selectedArtists.map(a => a.name)
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setRecommendations(data);
      } else {
        alert(`Error: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const removeArtist = (artistName: string) => {
    setSelectedArtists(selectedArtists.filter(a => a.name !== artistName));
  };

  // Initialize on mount
  useEffect(() => {
    // Check if user is authenticated (simplified check)
    const checkAuth = () => {
      fetch(`${API_BASE}/api/me`, { credentials: 'include' })
        .then(response => {
          console.log("Hi")
          if (response.ok) {
            setIsAuthenticated(true);
            fetchTopArtists();
          }
        })
        .catch(() => setIsAuthenticated(false));
    };

    checkAuth();
  }, []);

  // Check availability when Spotify artists are loaded
  useEffect(() => {
    if (spotifyArtists.length > 0) {
    }
  }, [spotifyArtists]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="bg-green-300 p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-shadow-2xs">Spotify Track Recommender</h1>
          <p className="mb-6">Connect your Spotify account to get personalized music recommendations</p>
          <button 
            onClick={handleSpotifyAuth}
            className="bg-green-500 text-gray-300 px-6 py-2 rounded hover:text-gray-50 hover:bg-gray-700 hover:cursor-pointer"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-8 items-center justify-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-300 mb-8 text-center text-shadow-black text-shadow-lg">Spotify Track Recommender</h1>

        {/* Step 1: Show Spotify Artists */}
        {spotifyArtists.length > 0 && (
          <div className="bg-green-300 bg p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4 text-shadow-2xs">Your Top Spotify Artists</h2>
            <div className="grid grid-cols-2 gap-2">
              {spotifyArtists.map(artist => (
                <div key={artist.name} className="flex items-center">
                  <span>
                    <ArtistCard {...artist} /> 
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Show Availability Status */}
        {false && availabilityResult && !recommendations && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Artist Availability Status</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{availabilityResult?.availableCount || 0}</div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{availabilityResult?.unavailableCount || 0}</div>
                <div className="text-sm text-gray-600">Not Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{availabilityResult?.needsMoreArtists || 0}</div>
                <div className="text-sm text-gray-600">Need More</div>
              </div>
            </div>
            
            {false && !availabilityResult?.canGenerateRecommendations && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-yellow-800">
                  You need {availabilityResult?.needsMoreArtists || 0} more artists to generate recommendations. 
                  Use the search below to find artists from our dataset.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Selected Artists - Only show if no recommendations yet */}
        {false && !recommendations && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Selected Artists ({selectedArtists.length}/5+)
          </h2>
          <div className="flex flex-wrap gap-2">
            {selectedArtists.map(artist => (
              <div key={artist.name} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span>{artist.name}</span>
                <button 
                  onClick={() => removeArtist(artist.name)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          {selectedArtists.length >= 5 && (
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate Recommendations'}
            </button>
          )}
        </div>
        )}

        {/* Step 5: Recommendations */}
        {recommendations && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Recommendations</h2>
            <div className="grid gap-3">
              {recommendations.recommendations.map((track, index) => (
                <div key={track} className="p-3 border rounded-lg flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  <span className="font-medium">{track}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Generated using {recommendations.algorithm} algorithm from {recommendations.artistNames.length} artists
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
