const axios = require('axios');
const ArtistRecommendation = require('../models/ArtistRecommendation');
const { getCuratedRecommendations } = require('./recommendationCuration');

/**
 * Get recommendations for a single artist (with caching)
 */
async function getArtistRecommendations(artistName) {
  // Check cache first
  let cached = await ArtistRecommendation.findOne({ artistName });
  
  if (cached) {
    // Update last accessed time
    cached.lastAccessed = new Date();
    await cached.save();
    console.log(`✅ Found cached recommendations for artist: ${artistName}`);
    return cached.recommendations;
  }

  // Fetch from ML API
  const base = process.env.ML_SERVICE_URL;
  if (!base) {
    console.warn(`⚠️ No ML_SERVICE_URL set, using mock for artist: ${artistName}`);
    return [`mock_rec_1_${artistName}`, `mock_rec_2_${artistName}`, `mock_rec_3_${artistName}`, `mock_rec_4_${artistName}`, `mock_rec_5_${artistName}`];
  }

  try {
    const url = `${base.replace(/\/$/, '')}/predict`;
    const { data } = await axios.get(url, { 
      params: { user_id: artistName },
      timeout: 10000 
    });

    if (!data || !Array.isArray(data.top_items)) {
      throw new Error('Invalid ML response format');
    }

    // Cache the results
    await ArtistRecommendation.create({
      artistId: artistName, // Using artist name as ID for now
      artistName,
      recommendations: data.top_items
    });

    console.log(`✅ Fetched and cached recommendations for artist: ${artistName}`);
    return data.top_items;
  } catch (err) {
    console.warn(`⚠️ Failed to fetch recommendations for artist ${artistName}:`, err.message);
    // Return mock data as fallback
    return [`mock_rec_1_${artistName}`, `mock_rec_2_${artistName}`, `mock_rec_3_${artistName}`, `mock_rec_4_${artistName}`, `mock_rec_5_${artistName}`];
  }
}

/**
 * Get curated recommendations by combining multiple artist recommendations
 */
async function getCuratedRecommendationsFromArtists(artistNames, targetCount = 5) {
  if (!Array.isArray(artistNames) || artistNames.length === 0) {
    return [];
  }

  console.log(`🎯 Getting curated recommendations for ${artistNames.length} artists:`, artistNames);

  // Get recommendations for each artist in parallel
  const artistRecs = await Promise.all(
    artistNames.map(artist => getArtistRecommendations(artist))
  );

  const curatedRecs = await getCuratedRecommendations(artistRecs, targetCount);

  console.log(`✅ Generated ${curatedRecs.length} meaningful curated recommendations`);
  return curatedRecs;
}

/**
 * Legacy function for backward compatibility
 */
async function fetchRecommendations(userId, likedTracks) {
  console.warn('⚠️ Using legacy fetchRecommendations - consider using getCuratedRecommendations instead');
  
  const base = process.env.ML_SERVICE_URL;
  if (!base) {
    return likedTracks.map((t, i) => `mock_rec_${i}_${t}`);
  }

  try {
    const url = `${base.replace(/\/$/, '')}/predict`;
    const { data } = await axios.post(url, { userId, likedTracks }, { timeout: 5000 });
    if (!data || !Array.isArray(data.recommendations)) {
      throw new Error('Invalid ML response');
    }
    return data.recommendations;
  } catch (err) {
    console.warn('⚠️ FastAPI not reachable, using mock:', err.message);
    return likedTracks.map((t, i) => `mock_rec_${i}_${t}`);
  }
}

module.exports = {
  fetchRecommendations, // Legacy
  getArtistRecommendations,
  getCuratedRecommendations: getCuratedRecommendationsFromArtists
};
