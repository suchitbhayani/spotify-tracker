const axios = require('axios');

/**
 * Calculate weighted score based on recommendation frequency across artists
 */
function calculateWeightedScore(trackId, artistRecommendations) {
  let score = 0;
  let appearances = 0;
  
  artistRecommendations.forEach((recs, index) => {
    if (recs.includes(trackId)) {
      // Higher weight for earlier positions (first recommendation gets highest weight)
      const position = recs.indexOf(trackId);
      const weight = Math.max(0, 5 - position); // 5, 4, 3, 2, 1 for positions 0-4
      score += weight;
      appearances++;
    }
  });
  
  // Bonus for tracks that appear in multiple artist recommendations
  const diversityBonus = appearances > 1 ? Math.log(appearances) * 0.5 : 0;
  
  return score + diversityBonus;
}

/**
 * Curation algorithm
 */
async function getCuratedRecommendations(artistRecommendations, targetCount = 5) {
  if (!Array.isArray(artistRecommendations) || artistRecommendations.length === 0) {
    return [];
  }

  console.log(`🎯 Curating recommendations from ${artistRecommendations.length} artists`);

  // Step 1: Create a frequency map of all recommended tracks
  const trackFrequency = new Map();
  const artistSets = artistRecommendations.map(recs => new Set(recs));

  artistRecommendations.forEach((recs, artistIndex) => {
    recs.forEach((trackId, position) => {
      if (!trackFrequency.has(trackId)) {
        trackFrequency.set(trackId, {
          count: 0,
          positions: [],
          artists: [],
          weightedScore: 0
        });
      }
      
      const trackData = trackFrequency.get(trackId);
      trackData.count++;
      trackData.positions.push(position);
      trackData.artists.push(artistIndex);
    });
  });


  // Step 2: Calculate weighted scores for each track
  for (const [trackId, trackData] of trackFrequency) {
    trackData.weightedScore = calculateWeightedScore(trackId, artistRecommendations);
  }

  // Step 3: Sort tracks by weighted score and select top recommendations
  const sortedTracks = Array.from(trackFrequency.entries())
    .map(([trackId, data]) => ({
      trackId,
      ...data,
      finalScore: data.weightedScore + (data.count * 0.5) // Frequency bonus
    }))
    .sort((a, b) => b.finalScore - a.finalScore);

  // Step 5: Apply diversity filtering to avoid too many tracks from same artists
  const finalRecommendations = [];
  const artistCounts = new Array(artistRecommendations.length).fill(0);
  const maxPerArtist = Math.ceil(targetCount / artistRecommendations.length) + 1;

  for (const track of sortedTracks) {
    if (finalRecommendations.length >= targetCount) break;
    
    // Check if we can add this track without exceeding per-artist limits
    const canAdd = track.artists.every(artistIndex => 
      artistCounts[artistIndex] < maxPerArtist
    );
    
    if (canAdd) {
      finalRecommendations.push(track.trackId);
      track.artists.forEach(artistIndex => {
        artistCounts[artistIndex]++;
      });
    }
  }

  // Step 6: If we don't have enough diverse tracks, fill with highest scoring
  while (finalRecommendations.length < targetCount && finalRecommendations.length < sortedTracks.length) {
    const nextTrack = sortedTracks.find(track => !finalRecommendations.includes(track.trackId));
    if (nextTrack) {
      finalRecommendations.push(nextTrack.trackId);
    } else {
      break;
    }
  }

  console.log(`✅ Generated ${finalRecommendations.length} curated recommendations`);
  console.log(`📊 Track selection details:`, finalRecommendations.map(trackId => {
    const data = trackFrequency.get(trackId);
    return {
      trackId,
      count: data.count,
      score: data.weightedScore.toFixed(2),
      artists: data.artists.length
    };
  }));

  return finalRecommendations;
}

/**
 * Fallback algorithm for when we have limited data
 */
function getSimpleIntersectionRecommendations(artistRecommendations, targetCount = 5) {
  const trackCounts = new Map();
  
  // Count how many times each track appears across artists
  artistRecommendations.forEach(recs => {
    recs.forEach(trackId => {
      trackCounts.set(trackId, (trackCounts.get(trackId) || 0) + 1);
    });
  });

  // Sort by frequency (most recommended tracks first)
  const sortedTracks = Array.from(trackCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([trackId]) => trackId);

  return sortedTracks.slice(0, targetCount);
}

module.exports = {
  getCuratedRecommendations,
  getSimpleIntersectionRecommendations,
  calculateWeightedScore,
};
