// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB || undefined;

// Fail fast if URI missing
if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Health route
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'spotify-recommender-backend',
    mongo: mongoose.connection?.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api/recommend', require('./routes/recommend'));
// Connect to MongoDB, then start server
mongoose
  .connect(MONGO_URI, { dbName: DB_NAME })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  try {
    await mongoose.connection.close();
  } finally {
    process.exit(0);
  }
});
