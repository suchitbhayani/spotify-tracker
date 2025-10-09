const { Schema, model } = require('mongoose');

const ArtistRecommendationSchema = new Schema(
  {
    artistId: { type: String, required: true, unique: true },
    artistName: { type: String, required: true },
    recommendations: { type: [String], required: true },
    cachedAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for fast lookups by artistId
ArtistRecommendationSchema.index({ artistId: 1 });

// Index for cleanup of old cache entries
ArtistRecommendationSchema.index({ cachedAt: 1 });

module.exports = model('ArtistRecommendation', ArtistRecommendationSchema);
