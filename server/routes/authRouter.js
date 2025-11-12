const axios = require("axios");
const express = require("express");
const pkce = require("../utils/pkce");
const dotenv = require("dotenv");

dotenv.config();
const CLIENT_ID = process.env.CLIENT_ID;
const PORT = process.env.PORT;

const router = express.Router();

// Dynamic redirect URI configuration for different environments
const getRedirectUri = (req) => {
  // Priority 1: Explicit environment variable (most reliable)
  if (process.env.SPOTIFY_REDIRECT_URI) {
    // Remove quotes and whitespace that might be in the env var
    let uri = process.env.SPOTIFY_REDIRECT_URI.trim();
    // Remove surrounding quotes if present
    uri = uri.replace(/^["']|["']$/g, '');
    console.log(`✅ Using SPOTIFY_REDIRECT_URI from env: "${uri}"`);
    console.log(`🔍 Raw env value: "${process.env.SPOTIFY_REDIRECT_URI}"`);
    return uri;
  }

  // Priority 2: BACKEND_URL environment variable
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/auth/spotify/callback`;
  }

  // Priority 3: Detect from request headers (works behind nginx proxy)
  const host = req.get('x-forwarded-host') || req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  
  // Production deployment (behind nginx proxy)
  if (process.env.NODE_ENV === 'production') {
    if (host) {
      // Use HTTPS in production if x-forwarded-proto is https or if behind HTTPS proxy
      const useHttps = protocol === 'https' || process.env.FORCE_HTTPS === 'true';
      return `${useHttps ? 'https' : 'http'}://${host}/auth/spotify/callback`;
    }
  }
  
  // Docker development - use container networking
  if (process.env.DOCKER === 'true' && process.env.NODE_ENV !== 'production') {
    return `http://backend:${PORT}/auth/spotify/callback`;
  }
  
  // Local development (non-Docker) - detect IPv4 vs IPv6
  if (host && (host.includes('::1') || host.includes('[::1]'))) {
    return `http://[::1]:${PORT}/auth/spotify/callback`;
  } else if (host && host.includes('127.0.0.1')) {
    return `http://127.0.0.1:${PORT}/auth/spotify/callback`;
  } else if (host) {
    return `${protocol}://${host}/auth/spotify/callback`;
  } else {
    return `http://localhost:${PORT}/auth/spotify/callback`;
  }
};

router.get("/spotify", async (req, res) => {
  if (!CLIENT_ID) {
    console.error("❌ Missing CLIENT_ID in .env");
    process.exit(1);
  }
  
  const { redirectURI } = req.query;
  if (!redirectURI) {
    return res.status(400).send('No redirect URI callback specified for endpoint');
  }
  
  req.session.redirectURI = redirectURI;

  const state = pkce.generateState(16);
  const codeVerifier = pkce.generateCodeVerifier(64);
  const codeChallenge = await pkce.generateCodeChallengeFromVerifier(codeVerifier);
  
  req.session.state = state;
  req.session.codeVerifier = codeVerifier;

  const authUrl = new URL("https://accounts.spotify.com/authorize")
  const scope = "user-follow-read user-top-read";
  
  // Get the appropriate redirect URI based on the request
  const redirectUri = getRedirectUri(req);
  console.log(`🔗 Using redirect URI: "${redirectUri}"`);
  console.log(`🔍 Redirect URI length: ${redirectUri.length}`);
  console.log(`🔍 Redirect URI bytes: ${Buffer.from(redirectUri).toString('hex')}`);
  console.log(`⚠️ CRITICAL: This URI must match EXACTLY what's in Spotify Developer Dashboard!`);
  console.log(`⚠️ Check for: trailing spaces, quotes, special characters, case sensitivity`);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: scope,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri
  });

  authUrl.search = new URLSearchParams(params).toString();
  
  // Log the redirect_uri parameter from the final URL (URL-encoded)
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  console.log(`🔗 Encoded redirect_uri in URL: "${encodedRedirectUri}"`);
  console.log(`🔗 Full authorization URL (first 200 chars): ${authUrl.toString().substring(0, 200)}...`);
  req.session.save(err => {
    if (err) {
      console.error("Failed to save session:", err.message);
      return res.status(500).send("Couldn't save session");
    }
    
    res.redirect(authUrl);
  });
});

router.get('/spotify/callback', async (req, res) => {
  const {code, error, state} = req.query;
  
  if (error) {
    console.error("❌ Spotify auth code error:", error);
    console.error("❌ Error details:", req.query);
    if (error === 'invalid_client' || error === 'invalid_request') {
      console.error("❌ INVALID_CLIENT/INVALID_REQUEST usually means redirect URI mismatch!");
      console.error("❌ Check that SPOTIFY_REDIRECT_URI in Render matches EXACTLY what's in Spotify Developer Dashboard");
      console.error("❌ Current SPOTIFY_REDIRECT_URI:", process.env.SPOTIFY_REDIRECT_URI);
    }
    return res.status(400).send(`Authorization failed: ${error}. Check server logs for details.`);
  }
  
  if (state !== req.session.state) {
    console.error("Spotify auth error: Mismatching request states");
    return res.status(409).send("Invalid State");
  }

  const codeVerifier = req.session.codeVerifier;

  // Get the same redirect URI that was used in the auth request
  const redirectUri = getRedirectUri(req);
  console.log(`🔗 Callback - Using redirect URI: "${redirectUri}"`);
  console.log(`⚠️ This MUST match EXACTLY what was sent to Spotify in the initial auth request!`);
  
  const url = "https://accounts.spotify.com/api/token";
  const payload = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  
  console.log(`🔗 Token exchange payload redirect_uri: "${redirectUri}"`);

  const opts = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };
  
  // https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
  try {
    const tokenRes = await axios.post(url, payload, opts);
    const tokenData = tokenRes.data;

    if (tokenData.error) {
      console.error("❌ Spotify auth access token error:", tokenData.error);
      console.error("❌ Error Description:", tokenData.error_description);
      console.error("❌ Redirect URI used:", redirectUri);
      if (tokenData.error === 'invalid_grant' || tokenData.error === 'invalid_request') {
        console.error("❌ INVALID_GRANT/INVALID_REQUEST often means redirect URI mismatch or expired code");
        console.error("❌ Verify redirect URI matches exactly between:");
        console.error("❌   1. Render Dashboard → SPOTIFY_REDIRECT_URI");
        console.error("❌   2. Spotify Developer Dashboard → Redirect URIs");
      }
      return res.status(400).send(`Authorization failed: ${tokenData.error}. Check server logs for details.`);
    }

    req.session.access_token = tokenData.access_token; 

    if (!req.session.redirectURI) {
      return res.status(400).send('No callback URI specified after auth')
    }
    req.session.save(err => {
      if (err) {
        console.error("Failed to save session:", err.message);
        return res.status(500).send("Couldn't save session");
      }
      res.redirect(`${req.session.redirectURI}`);
    });

  } catch(e) {
    console.error("Spotify callback handler error:", e.response || e.message);
    return res.status(500).send("Internal error during Spotify OAuth callback");
  }

});

module.exports = router;