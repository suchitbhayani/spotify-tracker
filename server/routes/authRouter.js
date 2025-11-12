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
  
  // Decode the redirect URI from query parameter
  const decodedRedirectURI = decodeURIComponent(redirectURI);
  req.session.redirectURI = decodedRedirectURI;
  console.log(`🔗 Stored frontend redirect URI in session: ${decodedRedirectURI}`);
  console.log(`🍪 Session ID: ${req.sessionID}`);

  const state = pkce.generateState(16);
  const codeVerifier = pkce.generateCodeVerifier(64);
  const codeChallenge = await pkce.generateCodeChallengeFromVerifier(codeVerifier);
  
  req.session.state = state;
  req.session.codeVerifier = codeVerifier;
  
  // Save session BEFORE redirecting to Spotify (critical for state persistence)
  // We need to save the session and ensure the cookie is set before redirecting
  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        console.error("❌ Failed to save session before Spotify redirect:", err.message);
        return reject(err);
      }
      console.log("✅ Session saved with state and codeVerifier before Spotify redirect");
      console.log(`🍪 Session ID after save: ${req.sessionID}`);
      console.log(`🍪 Session state value: "${req.session.state}"`);
      console.log(`🍪 Session has codeVerifier: ${!!req.session.codeVerifier}`);
      console.log(`🍪 Session cookie will be set with:`);
      console.log(`   - secure: ${process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false'}`);
      console.log(`   - sameSite: lax`);
      console.log(`   - httpOnly: true`);
      console.log(`   - path: /`);
      console.log(`   - domain: ${process.env.COOKIE_DOMAIN || 'undefined (same domain)'}`);
      
      // Force cookie to be set by accessing res.cookie or ensuring session middleware runs
      // The session middleware should set the cookie automatically, but we log it
      if (res.headersSent) {
        console.warn("⚠️ Response headers already sent - cookie may not be set!");
      } else {
        console.log("✅ Response headers not sent yet - cookie will be set on redirect");
      }
      
      resolve();
    });
  });

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
  
  // Session was already saved above, now redirect to Spotify
  // CRITICAL: We need to ensure the cookie is set BEFORE redirecting
  // express-session should set it automatically, but let's verify the cookie is in the response
  console.log(`🔗 Redirecting to Spotify authorization URL`);
  console.log(`🍪 Session cookie should be set in Set-Cookie header`);
  
  // Set a response header to verify the redirect is happening
  // The session middleware should have already set the Set-Cookie header
  // But we can't access it directly - express-session handles it internally
  
  // Redirect to Spotify - the session cookie should be sent with this redirect
  res.redirect(authUrl.toString());
});

router.get('/spotify/callback', async (req, res) => {
  const {code, error, state} = req.query;
  
  // Log immediately when callback is hit
  console.log(`\n🔔 ===== SPOTIFY CALLBACK HIT =====`);
  console.log(`🔔 Query params: code=${code ? 'present' : 'missing'}, state=${state || 'missing'}, error=${error || 'none'}`);
  console.log(`🔔 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  
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
  
  if (!code) {
    console.error("❌ ERROR: No authorization code received from Spotify!");
    return res.status(400).send("No authorization code received. Please try again.");
  }
  
  if (!state) {
    console.error("❌ ERROR: No state parameter received from Spotify!");
    return res.status(400).send("No state parameter received. Please try again.");
  }
  
  console.log(`🔍 Callback - Received state from Spotify: "${state}"`);
  console.log(`🔍 Callback - Stored state in session: "${req.session.state || 'MISSING'}"`);
  console.log(`🍪 Callback - Session ID: ${req.sessionID || 'MISSING'}`);
  console.log(`🔍 Callback - Session has state: ${!!req.session.state}`);
  console.log(`🔍 Callback - Session has codeVerifier: ${!!req.session.codeVerifier}`);
  console.log(`🔍 Callback - Session has redirectURI: ${!!req.session.redirectURI}`);
  
  // Check if cookies are being sent
  const cookiesReceived = req.headers.cookie || 'none';
  console.log(`🍪 Callback - Cookies received: ${cookiesReceived}`);
  console.log(`🍪 Callback - Looking for session cookie: ${cookiesReceived.includes('spotify-session') ? 'FOUND' : 'NOT FOUND'}`);
  
  // Parse cookies to see what we got
  if (cookiesReceived !== 'none') {
    const cookiePairs = cookiesReceived.split(';').map(c => c.trim());
    console.log(`🍪 Callback - Cookie count: ${cookiePairs.length}`);
    cookiePairs.forEach((cookie, idx) => {
      const [name] = cookie.split('=');
      console.log(`🍪 Callback - Cookie ${idx + 1}: ${name}${name === 'spotify-session' ? ' ✅' : ''}`);
    });
  }
  
  console.log(`🍪 Callback - Request headers: ${JSON.stringify({
    host: req.get('host'),
    'x-forwarded-host': req.get('x-forwarded-host'),
    'x-forwarded-proto': req.get('x-forwarded-proto'),
    origin: req.get('origin'),
    referer: req.get('referer')
  })}`);
  
  // Check if this is a new session (no session ID or different session)
  if (!req.sessionID) {
    console.error("❌ ERROR: No session ID! This means no session cookie was sent.");
    console.error("❌ The browser is not sending the session cookie back.");
    console.error("❌ Possible causes:");
    console.error("❌   1. Cookie was never set (check initial request logs)");
    console.error("❌   2. Cookie domain/path mismatch");
    console.error("❌   3. Cookie secure flag mismatch (HTTPS vs HTTP)");
    console.error("❌   4. Cookie SameSite blocking cross-site redirect");
    console.error("❌   5. Browser blocking third-party cookies");
    console.error(`❌ Current cookie settings:`);
    console.error(`❌   - secure: ${process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false'}`);
    console.error(`❌   - sameSite: ${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`);
    console.error(`❌   - httpOnly: true`);
    console.error(`❌   - domain: undefined (same domain)`);
    console.error(`❌   - path: /`);
    console.error(`❌   - FORCE_HTTPS env var: ${process.env.FORCE_HTTPS || 'not set'}`);
    return res.status(400).send("Session cookie not found. Please try connecting again.");
  }
  
  if (!req.session.state) {
    console.error("❌ ERROR: No state in session! Session exists but has no state.");
    console.error(`❌ Session ID: ${req.sessionID}`);
    console.error(`❌ Session keys: ${Object.keys(req.session).join(', ') || 'empty session'}`);
    console.error("❌ This usually means:");
    console.error("❌   1. Session was created but state wasn't saved");
    console.error("❌   2. Session was cleared/reset");
    console.error("❌   3. Different session ID (new session created)");
    console.error(`❌ Current session cookie settings:`);
    console.error(`❌   - secure: ${process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false'}`);
    console.error(`❌   - sameSite: ${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`);
    console.error(`❌   - httpOnly: true`);
    console.error(`❌   - domain: undefined (same domain)`);
    console.error(`❌   - path: /`);
    console.error(`❌   - FORCE_HTTPS env var: ${process.env.FORCE_HTTPS || 'not set'}`);
    console.error(`❌ Received state from Spotify: "${state}"`);
    console.error(`❌ But session has no state stored!`);
    return res.status(400).send("Session expired. Please try connecting again.");
  }
  
  if (state !== req.session.state) {
    console.error("❌ ERROR: State mismatch!");
    console.error(`❌ Received from Spotify: "${state}"`);
    console.error(`❌ Stored in session: "${req.session.state}"`);
    console.error("❌ This usually means the session was lost or corrupted during redirect");
    return res.status(409).send("Invalid State - session may have expired. Please try again.");
  }
  
  console.log("✅ State matches - proceeding with token exchange");

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
    req.session.refresh_token = tokenData.refresh_token;
    req.session.token_expires_at = Date.now() + (tokenData.expires_in * 1000);
    
    console.log(`✅ OAuth successful! Access token stored in session`);
    console.log(`🔗 Redirecting to frontend: ${req.session.redirectURI}`);
    console.log(`🍪 Session ID: ${req.sessionID}`);

    if (!req.session.redirectURI) {
      console.error("❌ No redirect URI in session - using fallback");
      // Fallback to frontend URL if redirectURI is missing
      const fallbackUrl = process.env.FRONTEND_URL || process.env.FRONTEND_URI || 'https://spotify-tracker-fullstack.onrender.com';
      console.log(`🔗 Using fallback URL: ${fallbackUrl}`);
      return res.redirect(fallbackUrl);
    }
    
    // Construct redirect URL with auth success parameter
    let redirectUrl;
    try {
      redirectUrl = new URL(req.session.redirectURI);
      redirectUrl.searchParams.set('auth', 'success');
      console.log(`✅ Session saved successfully, redirecting to: ${redirectUrl.toString()}`);
    } catch (urlError) {
      console.error("❌ Error constructing redirect URL:", urlError.message);
      console.error("❌ Redirect URI was:", req.session.redirectURI);
      // Fallback: use frontend URL from environment
      const fallbackUrl = process.env.FRONTEND_URL || process.env.FRONTEND_URI || 'https://spotify-tracker-fullstack.onrender.com';
      redirectUrl = new URL(fallbackUrl);
      redirectUrl.searchParams.set('auth', 'success');
      console.log(`🔗 Using fallback URL: ${redirectUrl.toString()}`);
    }
    
    req.session.save(err => {
      if (err) {
        console.error("❌ Failed to save session:", err.message);
        return res.status(500).send("Couldn't save session");
      }
      res.redirect(redirectUrl.toString());
    });

  } catch(e) {
    console.error("Spotify callback handler error:", e.response || e.message);
    return res.status(500).send("Internal error during Spotify OAuth callback");
  }

});

module.exports = router;