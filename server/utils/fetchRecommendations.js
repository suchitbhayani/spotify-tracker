const axios = require('axios');

module.exports = async function fetchRecommendations(userId, likedTracks) {
  const base = process.env.ML_SERVICE_URL;
  if (!base) {
    // Fallback: generate mock recs
    return likedTracks.map((t, i) => `mock_rec_${i}_${t}`);
  }

  try {
    const url = `${base.replace(/\/$/, '')}/predict`;
    const { data, headers } = await axios.post(url, { userId, likedTracks }, { timeout: 5000 });
    if (!data || !Array.isArray(data.recommendations)) {
      throw new Error('Invalid ML response');
    }
    return data.recommendations;
  } catch (err) {
    console.warn('⚠️ FastAPI not reachable, using mock:', err.message);
    return likedTracks.map((t, i) => `mock_rec_${i}_${t}`);
  }
};
