const { Schema, model } = require('mongoose');

const RecommendationSchema = new Schema(
  {
    userId: { type: String, required: true },
    likedTracks: { type: [String], required: true },
    recommendations: { type: [String], required: true },
  },
  { timestamps: true }
);

// helpful index to query latest per user
RecommendationSchema.index({ userId: 1, createdAt: -1 });

module.exports = model('Recommendation', RecommendationSchema);