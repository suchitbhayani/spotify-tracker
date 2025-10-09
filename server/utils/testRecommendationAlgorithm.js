// Import the functions directly without axios dependency
const { getSimpleIntersectionRecommendations } = require('./recommendationCuration');

// Simplified version of getCuratedRecommendations for testing
function getCuratedRecommendations(artistRecommendations, targetCount = 5) {
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

  // Step 2: Calculate similarity scores between artists
  const artistSimilarities = [];
  for (let i = 0; i < artistSets.length; i++) {
    for (let j = i + 1; j < artistSets.length; j++) {
      const intersection = new Set([...artistSets[i]].filter(x => artistSets[j].has(x)));
      const union = new Set([...artistSets[i], ...artistSets[j]]);
      const similarity = intersection.size / union.size;
      
      artistSimilarities.push({
        artist1: i,
        artist2: j,
        similarity: similarity
      });
    }
  }

  // Step 3: Calculate weighted scores for each track
  for (const [trackId, trackData] of trackFrequency) {
    let score = 0;
    let appearances = 0;
    
    artistRecommendations.forEach((recs, index) => {
      if (recs.includes(trackId)) {
        const position = recs.indexOf(trackId);
        const weight = Math.max(0, 5 - position); // 5, 4, 3, 2, 1 for positions 0-4
        score += weight;
        appearances++;
      }
    });
    
    const diversityBonus = appearances > 1 ? Math.log(appearances) * 0.5 : 0;
    trackData.weightedScore = score + diversityBonus;
    
    // Bonus for tracks recommended by similar artists
    let similarityBonus = 0;
    trackData.artists.forEach(artistIndex => {
      artistSimilarities.forEach(sim => {
        if (sim.artist1 === artistIndex || sim.artist2 === artistIndex) {
          similarityBonus += sim.similarity * 0.1;
        }
      });
    });
    
    trackData.weightedScore += similarityBonus;
  }

  // Step 4: Sort tracks by weighted score and select top recommendations
  const sortedTracks = Array.from(trackFrequency.entries())
    .map(([trackId, data]) => ({
      trackId,
      ...data,
      finalScore: data.weightedScore + (data.count * 0.5) // Frequency bonus
    }))
    .sort((a, b) => b.finalScore - a.finalScore);

  // Step 5: Apply diversity filtering
  const finalRecommendations = [];
  const artistCounts = new Array(artistRecommendations.length).fill(0);
  const maxPerArtist = Math.ceil(targetCount / artistRecommendations.length) + 1;

  for (const track of sortedTracks) {
    if (finalRecommendations.length >= targetCount) break;
    
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

  // Fill remaining slots with highest scoring tracks
  while (finalRecommendations.length < targetCount && finalRecommendations.length < sortedTracks.length) {
    const nextTrack = sortedTracks.find(track => !finalRecommendations.includes(track.trackId));
    if (nextTrack) {
      finalRecommendations.push(nextTrack.trackId);
    } else {
      break;
    }
  }

  return finalRecommendations;
}

/**
 * Test the similarity-based recommendation algorithm with sample data
 */
function testRecommendationAlgorithm() {
  console.log('🧪 Testing Similarity-Based Recommendation Algorithm\n');

  // Sample data: 3 artists with their top 5 recommendations each
  const sampleArtistRecommendations = [
    // Artist 1: Rock/Pop
    ['track_rock_1', 'track_rock_2', 'track_rock_3', 'track_rock_4', 'track_rock_5'],
    
    // Artist 2: Pop (some overlap with Artist 1)
    ['track_pop_1', 'track_rock_2', 'track_pop_3', 'track_pop_4', 'track_pop_5'],
    
    // Artist 3: Alternative (some overlap with both)
    ['track_alt_1', 'track_rock_1', 'track_alt_3', 'track_pop_1', 'track_alt_5']
  ];

  console.log('📊 Sample Artist Recommendations:');
  sampleArtistRecommendations.forEach((recs, index) => {
    console.log(`  Artist ${index + 1}:`, recs);
  });
  console.log('');

  // Test the similarity-based algorithm
  console.log('🎯 Testing Similarity-Based Algorithm:');
  const similarityResults = getCuratedRecommendations(sampleArtistRecommendations, 5);
  console.log('Results:', similarityResults);
  console.log('');

  // Test the simple intersection algorithm for comparison
  console.log('📈 Testing Simple Intersection Algorithm:');
  const intersectionResults = getSimpleIntersectionRecommendations(sampleArtistRecommendations, 5);
  console.log('Results:', intersectionResults);
  console.log('');

  // Analyze the results
  console.log('📋 Analysis:');
  console.log('Similarity-based algorithm considers:');
  console.log('  - Track frequency across artists');
  console.log('  - Position weighting (earlier recommendations get higher scores)');
  console.log('  - Artist similarity (Jaccard similarity)');
  console.log('  - Diversity constraints (max tracks per artist)');
  console.log('  - Intersection bonuses for tracks appearing in multiple lists');
  console.log('');

  // Test with different scenarios
  console.log('🔄 Testing Edge Cases:');
  
  // Test with no overlap
  const noOverlapRecommendations = [
    ['track_a1', 'track_a2', 'track_a3', 'track_a4', 'track_a5'],
    ['track_b1', 'track_b2', 'track_b3', 'track_b4', 'track_b5']
  ];
  
  console.log('No overlap scenario:');
  const noOverlapResults = getCuratedRecommendations(noOverlapRecommendations, 3);
  console.log('Results:', noOverlapResults);
  console.log('');

  // Test with high overlap
  const highOverlapRecommendations = [
    ['track_x1', 'track_x2', 'track_x3', 'track_x4', 'track_x5'],
    ['track_x1', 'track_x2', 'track_x3', 'track_y4', 'track_y5'],
    ['track_x1', 'track_x2', 'track_z3', 'track_z4', 'track_z5']
  ];
  
  console.log('High overlap scenario:');
  const highOverlapResults = getCuratedRecommendations(highOverlapRecommendations, 3);
  console.log('Results:', highOverlapResults);
  console.log('');
}

// Run the test
if (require.main === module) {
  testRecommendationAlgorithm();
}

module.exports = { testRecommendationAlgorithm };
