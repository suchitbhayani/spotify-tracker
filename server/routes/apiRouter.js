const axios = require('axios');
const express = require('express');
const Recommendation = require('../models/Recommendation');
const ArtistRecommendation = require('../models/ArtistRecommendation');
const { fetchRecommendations, getCuratedRecommendations, getArtistRecommendations } = require('../utils/fetchRecommendations');

const router = express.Router();

router.get('/me', (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).json({ authenticated: false });
  }
  
  return res.json({authenticated: true});
});

router.get('/top_artists', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    return res.status(401).json({ error: 'No access token - please authenticate with Spotify first' });
  }
  
  const url = "https://api.spotify.com/v1/me/top/artists?limit=10"
  
  const payload = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    }
  };
  
  try {
    const result = await axios.get(url, payload);
    
    if (result.error) {
      console.error("Spotify GET request failed")
    }
    const data = result.data;
    
    // Extract artist names for recommendation system
    const artistNames = data.items.map(artist => artist.name);
    const artistIds = data.items.map(artist => artist.id);
    const artistImagesURLs= data.items.map(artist => {
      if (!artist.images || artist.images.length == 0) {
        return `data:image/png;base64,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`
      }

      return artist.images[0].url
    })
    
    console.log(`📊 Retrieved ${artistNames.length} top artists:`, artistNames);
    console.log(`📊 Retrieved ${artistImagesURLs.length} artist Images`, artistImagesURLs);
    
    res.json({
      artists: data.items,
      artistNames: artistNames,
      artistIds: artistIds,
      artistImageURLs: artistImagesURLs,
    });
  } catch (e) {
    console.error("❌ Spotify GET request failed:", e.message);
    console.error("❌ Error details:", {
      status: e.response?.status,
      statusText: e.response?.statusText,
      data: e.response?.data,
      message: e.message,
      code: e.code
    });
    
    // Log the full error response from Spotify for 403 errors
    if (e.response?.status === 403) {
      console.error("❌ 403 Forbidden - Full Spotify error response:", JSON.stringify(e.response.data, null, 2));
      console.error("❌ This usually means:");
      console.error("❌   1. The access token doesn't have 'user-top-read' scope");
      console.error("❌   2. The user hasn't granted permission to access their top artists");
      console.error("❌   3. The Spotify app doesn't have the required permissions");
      console.error("❌ Current access token (first 20 chars):", access_token ? access_token.substring(0, 20) + '...' : 'MISSING');
    }
    
    // Handle different error types
    if (e.response) {
      // Spotify API returned an error
      const status = e.response.status;
      const errorData = e.response.data;
      
      if (status === 401) {
        console.error("❌ 401 Unauthorized - access token expired or invalid");
        return res.status(401).json({ 
          error: "Spotify authentication expired. Please reconnect your Spotify account.",
          code: "AUTH_EXPIRED"
        });
      } else if (status === 403) {
        console.error("❌ 403 Forbidden - insufficient permissions");
        const spotifyError = errorData?.error || (typeof errorData === 'string' ? errorData : 'Unknown error');
        
        // Check for specific Spotify error messages
        let userMessage = "Insufficient permissions to access top artists. Please reconnect with proper permissions.";
        if (typeof spotifyError === 'string' && spotifyError.includes('not be registered')) {
          userMessage = "Your Spotify account needs to be added to the app's user allowlist. Please contact the app administrator or check developer.spotify.com/dashboard.";
        } else if (typeof spotifyError === 'string' && spotifyError.includes('developer.spotify.com')) {
          userMessage = "Please check the Spotify Developer Dashboard settings. Your account may need to be added to the app's user allowlist.";
        }
        
        return res.status(403).json({ 
          error: userMessage,
          code: "INSUFFICIENT_PERMISSIONS",
          details: typeof errorData === 'string' ? errorData : errorData?.error?.message || spotifyError
        });
      } else if (status === 429) {
        console.error("❌ 429 Rate limited by Spotify");
        return res.status(429).json({ 
          error: "Rate limited by Spotify. Please try again later.",
          code: "RATE_LIMITED"
        });
      } else {
        return res.status(status || 500).json({ 
          error: "Failed to fetch top artists from Spotify",
          details: errorData?.error?.message || e.message,
          code: "SPOTIFY_API_ERROR"
        });
      }
    } else if (e.request) {
      // Request was made but no response received
      console.error("❌ No response from Spotify API");
      return res.status(503).json({ 
        error: "Could not reach Spotify API. Please try again later.",
        code: "NETWORK_ERROR"
      });
    } else {
      // Error setting up the request
      console.error("❌ Error setting up request:", e.message);
      return res.status(500).json({ 
        error: "Failed to fetch top artists from Spotify",
        details: e.message,
        code: "REQUEST_ERROR"
      });
    }
  }
});

router.get('/recs_from_top_artists', async (req, res) => {
  const url = 'http://[::]:8080/api/top_artists';
  
  const { data } = await axios.get(url, { timeout: 50000 });
  if (!data) {
    return res.status(400).json({ error: "Failed to get recommendations from top artists"});
  }
  
});

// Check which Spotify artists are available and auto-generate if possible
router.post('/check_artists_availability', async (req, res) => {
  const { artistNames, userId } = req.body || {};
  
  if (!Array.isArray(artistNames) || artistNames.length === 0) {
    return res.status(400).json({ error: 'artistNames (array) is required' });
  }

  try {
    const base = process.env.ML_SERVICE_URL;
    if (!base) {
      return res.status(503).json({ error: 'ML service not configured' });
    }

    // Get available artists from ML service
    const url = `${base.replace(/\/$/, '')}/artists`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const availableArtists = new Set(data.artists);

    // Check availability of each Spotify artist
    const availabilityResults = artistNames.map((artistName, index) => ({
      artistName,
      available: availableArtists.has(artistName)
    }));

    const availableArtistsList = availabilityResults.filter(result => result.available);
    const unavailableArtistsList = availabilityResults.filter(result => !result.available);

    console.log(`🎯 Artist availability check: ${availableArtistsList.length}/${artistNames.length} available`);

    // If we have 5+ available artists, auto-generate recommendations
    if (availableArtistsList.length >= 5) {
      console.log(`✅ Auto-generating recommendations with ${availableArtistsList.length} available artists`);
      
      // Generate recommendations immediately
      const recommendations = [];
      const artistNamesForRecs = availableArtistsList.map(a => a.artistName);
      
      for (const artistName of artistNamesForRecs) {
        try {
          const predictUrl = `${base.replace(/\/$/, '')}/predict`;
          const { data: artistData } = await axios.get(predictUrl, { 
            params: { user_id: artistName },
            timeout: 10000 
          });
          
          if (artistData && Array.isArray(artistData.top_items)) {
            recommendations.push(...artistData.top_items.slice(0, 1)); // Take 1 from each to get variety
          }
        } catch (err) {
          console.warn(`⚠️ Failed to get recommendations for ${artistName}:`, err.message);
        }
      }

      // Remove duplicates and limit to 5 recommendations
      const uniqueRecommendations = [...new Set(recommendations)].slice(0, 5);
      
      // Save to database
      const doc = await Recommendation.create({ 
        userId: userId || 'auto_user',
        likedTracks: artistNamesForRecs,
        recommendations: uniqueRecommendations
      });

      return res.json({
        autoGenerated: true,
        totalArtists: artistNames.length,
        availableCount: availableArtistsList.length,
        unavailableCount: unavailableArtistsList.length,
        availableArtists: availableArtistsList,
        unavailableArtists: unavailableArtistsList,
        recommendations: {
          userId: doc.userId,
          artistNames: doc.likedTracks,
          recommendations: doc.recommendations,
          recommendationCount: doc.recommendations.length,
          algorithm: 'ml-model-similarity',
          createdAt: doc.createdAt
        }
      });
    }

    // If <5 available artists, return availability info for search interface
    res.json({
      autoGenerated: false,
      totalArtists: artistNames.length,
      availableCount: availableArtistsList.length,
      unavailableCount: unavailableArtistsList.length,
      availableArtists: availableArtistsList,
      unavailableArtists: unavailableArtistsList,
      needsMoreArtists: 5 - availableArtistsList.length,
      message: `Need ${5 - availableArtistsList.length} more artists to generate recommendations`
    });
  } catch (err) {
    console.error('❌ Failed to check artist availability:', err.message);
    res.status(500).json({ error: 'Failed to check artist availability in dataset' });
  }
});

// Generate recommendations from manually selected artist list (search interface)
router.post('/recommend', async (req, res) => {
  const { userId, artistNames } = req.body || {};
  
  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId (string) is required' });
  }
  
  if (!Array.isArray(artistNames) || artistNames.length < 5) {
    return res.status(400).json({ error: 'artistNames (array) with at least 5 artists is required' });
  }

  try {
    console.log(`🎯 Generating manual recommendations for user ${userId} with ${artistNames.length} artists`);
    
    // Single validation point - ensure all artists exist in dataset
    const baseUrl = process.env.ML_SERVICE_URL;
    if (!baseUrl) {
      return res.status(503).json({ error: 'ML service not configured' });
    }

    const url = `${baseUrl.replace(/\/$/, '')}/artists`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const availableArtists = new Set(data.artists);

    const unavailableArtists = artistNames.filter(artist => !availableArtists.has(artist));
    if (unavailableArtists.length > 0) {
      return res.status(400).json({ 
        error: 'Some artists are not available in the dataset',
        unavailableArtists,
        message: `Please remove these artists: ${unavailableArtists.join(', ')}`
      });
    }

    // Generate recommendations using the ML model
    const recommendations = [];
    
    // Get top 2 tracks from each artist for variety
    for (const artistName of artistNames) {
      try {
        const predictUrl = `${baseUrl.replace(/\/$/, '')}/predict`;
        const { data: artistData } = await axios.get(predictUrl, { 
          params: { user_id: artistName },
          timeout: 10000 
        });
        
        if (artistData && Array.isArray(artistData.top_items)) {
          recommendations.push(...artistData.top_items.slice(0, 2));
        }
      } catch (err) {
        console.warn(`⚠️ Failed to get recommendations for ${artistName}:`, err.message);
      }
    }

    // Remove duplicates and limit to 5 recommendations
    const uniqueRecommendations = [...new Set(recommendations)].slice(0, 5);
    
    // Save to database
    const doc = await Recommendation.create({ 
      userId, 
      likedTracks: artistNames,
      recommendations: uniqueRecommendations
    });
    
    console.log(`✅ Successfully generated ${uniqueRecommendations.length} manual recommendations for user ${userId}`);
    
    return res.status(201).json({
      userId: doc.userId,
      artistNames: doc.likedTracks,
      recommendations: doc.recommendations,
      recommendationCount: doc.recommendations.length,
      algorithm: 'ml-model-similarity',
      source: 'manual_selection',
      createdAt: doc.createdAt
    });
  } catch (err) {
    console.error('❌ Recommendation generation error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Legacy endpoint for backward compatibility
router.post('/recommend/legacy', async (req, res) => {
  const { userId, likedTracks } = req.body || {};
  if (typeof userId !== 'string' || !Array.isArray(likedTracks)) {
    return res.status(400).json({ error: 'userId (string) and likedTracks (array) required' });
  }

  try {
    const recs = await fetchRecommendations(userId, likedTracks);
    const doc = await Recommendation.create({ userId, likedTracks, recommendations: recs });
    return res.status(201).json(doc);
  } catch (err) {
    console.error('❌ DB error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search artists in the dataset
router.get('/artists/search', async (req, res) => {
  const { q: query, limit = 10 } = req.query;
  
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" is required and must be at least 2 characters' });
  }

  try {
    const base = process.env.ML_SERVICE_URL;
    if (!base) {
      return res.status(503).json({ error: 'ML service not configured' });
    }

    const url = `${base.replace(/\/$/, '')}/artists`;
    const { data } = await axios.get(url, { timeout: 5000 });
    
    // Filter artists based on query (case-insensitive)
    const searchQuery = query.toLowerCase();
    const matchingArtists = data.artists
      .filter(artist => artist.toLowerCase().includes(searchQuery))
      .slice(0, parseInt(limit))
      .map(artist => ({
        name: artist,
        matchType: artist.toLowerCase() === searchQuery ? 'exact' : 'partial'
      }));

    console.log(`🔍 Artist search for "${query}": found ${matchingArtists.length} results`);

    res.json({
      query,
      results: matchingArtists,
      count: matchingArtists.length,
      totalAvailable: data.artists.length
    });
  } catch (err) {
    console.error('❌ Failed to search artists:', err.message);
    res.status(500).json({ error: 'Failed to search artists in dataset' });
  }
});

// Get all available artists (for debugging/admin purposes)
router.get('/artists/available', async (req, res) => {
  try {
    const base = process.env.ML_SERVICE_URL;
    if (!base) {
      return res.status(503).json({ error: 'ML service not configured' });
    }

    const url = `${base.replace(/\/$/, '')}/artists`;
    const { data } = await axios.get(url, { timeout: 5000 });
    
    res.json({
      availableArtists: data.artists,
      count: data.artists.length
    });
  } catch (err) {
    console.error('❌ Failed to fetch available artists:', err.message);
    res.status(500).json({ error: 'Failed to fetch available artists from ML service' });
  }
});

router.get('/artists/cached', async (req, res) => {
  try {
    const cached = await ArtistRecommendation.find({}).select('artistName cachedAt lastAccessed');
    res.json({
      cachedArtists: cached,
      count: cached.length
    });
  } catch (err) {
    console.error('❌ Failed to fetch cached artists:', err.message);
    res.status(500).json({ error: 'Failed to fetch cached artists' });
  }
});

router.post('/artists/cache/:artistName', async (req, res) => {
  const { artistName } = req.params;
  
  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
    console.log(`🔄 Manually caching recommendations for artist: ${artistName}`);
    const recommendations = await getArtistRecommendations(artistName);
    
    res.json({
      artistName,
      recommendations,
      cached: true,
      message: `Successfully cached ${recommendations.length} recommendations for ${artistName}`
    });
  } catch (err) {
    console.error(`❌ Failed to cache artist ${artistName}:`, err.message);
    res.status(500).json({ error: `Failed to cache recommendations for ${artistName}` });
  }
});

router.delete('/artists/cache/:artistName', async (req, res) => {
  const { artistName } = req.params;
  
  try {
    const result = await ArtistRecommendation.deleteOne({ artistName });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: `No cached recommendations found for ${artistName}` });
    }
    
    res.json({
      message: `Successfully deleted cached recommendations for ${artistName}`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error(`❌ Failed to delete cache for ${artistName}:`, err.message);
    res.status(500).json({ error: `Failed to delete cached recommendations for ${artistName}` });
  }
});

router.delete('/artists/cache', async (req, res) => {
  try {
    const result = await ArtistRecommendation.deleteMany({});
    
    res.json({
      message: 'Successfully cleared all cached artist recommendations',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('❌ Failed to clear cache:', err.message);
    res.status(500).json({ error: 'Failed to clear cached recommendations' });
  }
});

module.exports = router;