const express = require('express');
const Recommendation = require('../models/Recommendation');
const fetchRecommendations = require('../utils/fetchRecommendations');

const router = express.Router();

router.post('/', async (req, res) => {
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

module.exports = router;