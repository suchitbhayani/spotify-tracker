// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');

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

app.use(cors({
  origin: process.env.FRONTEND_URI,
  credentials: true,
}));
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
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: 'lax',
    httpOnly: true,
    secure: false,
    priority: 'high',
  }
}));

app.use('/api', require('./routes/apiRouter'));
app.use('/auth', require('./routes/authRouter'));


// Connect to MongoDB, then start server
mongoose
  .connect(MONGO_URI, { dbName: DB_NAME })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '::1', () => {
      console.log(`🚀 Server listening on http://[::1]:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
// try {
//   app.listen(PORT, '::1', () => {
//     console.log(`🚀 Server listening on http://[::1]:${PORT}`);
//   })
// } catch (err) {
//   console.error('❌ Server startup failure', err.message);  
//   process.exit(1);
// };

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  try {
    await mongoose.connection.close();
  } finally {
    process.exit(0);
  }
});
