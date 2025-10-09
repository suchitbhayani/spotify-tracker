const axios = require('axios');
const express = require('express');
const Recommendation = require('../models/Recommendation');
const fetchRecommendations = require('../utils/fetchRecommendations');

const router = express.Router();

router.get('/top_artists', async (req, res) => {
  const access_token = req.session.access_token;
  if (!access_token) {
    // TODO: Change to add new page where user can auth then come back
    //res.redirect('http://[::1]:8080/auth/spotify');
    return;
  }
  
  const url = "https://api.spotify.com/v1/me/top/artists?limit=10"
  
  const payload = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    }
  };
  
  try {
    const result = await axios.get(url, payload);
    const data = result.data;
    //for (let i = 1; i <= 10; ++i) {
    //  artist = data.items[i - 1];
    //  console.log(`Artist ${i}\n\tName: ${artist.name}\n\tID: ${artist.id}`);
    //}
  } catch (e) {
    console.error("Spotify GET request failed:", e.message);
    return res.status(400).send("Spotify GET top artists request failed");
  }
});

router.post('/recommend', async (req, res) => {
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