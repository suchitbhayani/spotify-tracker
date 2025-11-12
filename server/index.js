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

// CORS configuration - handle production and development
const getCorsOrigin = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5173/',
    'http://[::1]:5173',
    'http://[::1]:5173/',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5173/',
  ];

  // Add environment variable origins if set
  if (process.env.FRONTEND_URI) {
    origins.push(process.env.FRONTEND_URI);
  }
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  if (process.env.BACKEND_URL) {
    origins.push(process.env.BACKEND_URL);
  }

  return origins.filter(Boolean);
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getCorsOrigin();
    
    // In production behind nginx, allow same origin (requests come through proxy)
    // This handles the case where frontend and backend are on the same domain
    if (process.env.NODE_ENV === 'production') {
      // Allow if origin matches backend URL or is in allowed list
      if (process.env.BACKEND_URL && origin === process.env.BACKEND_URL) {
        return callback(null, true);
      }
      if (process.env.FRONTEND_URI && origin === process.env.FRONTEND_URI) {
        return callback(null, true);
      }
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Reject in production if not in allowed list
    console.warn(`CORS: Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Trust proxy for secure cookies and correct IP addresses behind nginx
// This MUST be set before session middleware when behind a reverse proxy (nginx, Render, etc.)
app.set('trust proxy', 1);

// Root route - return API info (nginx serves frontend at root, but this is a fallback)
app.get('/', (req, res) => {
  res.json({
    service: 'spotify-recommender-backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/auth',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health route
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'spotify-recommender-backend',
    mongo: mongoose.connection?.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: true, // Save session even if empty (needed for OAuth state)
  name: 'spotify-session', // Custom session name
  cookie: {
    // CRITICAL: Use 'none' for OAuth redirects from external domains (Spotify)
    // 'lax' blocks cookies on cross-site redirects, which breaks OAuth
    // 'none' requires secure: true (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true, // Prevent XSS attacks
    // Use secure cookies in production (HTTPS required)
    // Behind nginx with HTTPS, cookies must be secure
    // CRITICAL: sameSite: 'none' REQUIRES secure: true
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false',
    priority: 'high',
    // Set maxAge for session expiration (24 hours)
    maxAge: 24 * 60 * 60 * 1000,
    // Set path to root so cookie works for all routes
    path: '/',
    // CRITICAL: Do NOT set domain - let browser set it based on request domain
    // Setting a domain can break cookies when behind a reverse proxy
    // This was likely the issue with IPv4 vs IPv6 - domain mismatch
    domain: undefined, // Always undefined - never set domain
  },
  // Trust proxy for secure cookies and correct IP addresses behind nginx
  // This MUST be set when behind a reverse proxy (nginx, Render, etc.)
  proxy: true,
};

// Log session configuration in production for debugging
if (process.env.NODE_ENV === 'production') {
  console.log('🍪 Session configuration:');
  console.log(`   - secure: ${sessionConfig.cookie.secure}`);
  console.log(`   - sameSite: ${sessionConfig.cookie.sameSite}`);
  console.log(`   - httpOnly: ${sessionConfig.cookie.httpOnly}`);
  console.log(`   - path: ${sessionConfig.cookie.path}`);
  console.log(`   - domain: ${sessionConfig.cookie.domain || 'undefined (same domain)'}`);
  console.log(`   - maxAge: ${sessionConfig.cookie.maxAge}ms (24 hours)`);
  console.log(`   - name: ${sessionConfig.name}`);
}

app.use(session(sessionConfig));

app.use('/api', require('./routes/apiRouter'));
app.use('/auth', require('./routes/authRouter'));

// Connect to MongoDB, then start server
mongoose
  .connect(MONGO_URI, { dbName: DB_NAME })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.BACKEND_URL) {
        console.log(`🔗 Backend URL: ${process.env.BACKEND_URL}`);
      }
      if (process.env.SPOTIFY_REDIRECT_URI) {
        console.log(`🎵 Spotify Redirect URI: ${process.env.SPOTIFY_REDIRECT_URI}`);
      }
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
