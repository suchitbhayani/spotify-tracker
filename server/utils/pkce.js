const crypto = require("crypto");

// Source: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
const generateCodeVerifier = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const possibleLength = possible.length;

  // We generate twice the amount of rand values due to our generation alg
  const values = crypto.getRandomValues(new Uint8Array(length * 2));

  // To prevent modulo bias, we only accept:
  //      currVal in [0, Largest Mult of possible.length < values.length]
  const res = [];
  let i = 0;
  while (res.length < length && i < values.length) {
    const currVal = values[i++];
    if (currVal < Math.floor(256 / possibleLength) * possibleLength) {
      res.push(possible[currVal % possibleLength]);
    }
  }

  // There is a chance that res was not fully generated so try again
  if (res.length < length) {
    return generateCodeVerifier(length);
  }

  return res.join("");
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

async function generateCodeChallenge(length) {
  return base64encode(
    await sha256(
      generateCodeVerifier(length)
    )
  );
}

async function generateCodeChallengeFromVerifier(codeVerifier) {
  return base64encode(
    await sha256(
      codeVerifier
    )
  );
}

function generateState(length) {
  return generateCodeVerifier(length);
}

module.exports = {
  generateCodeChallengeFromVerifier,
  generateCodeVerifier,
  generateState,
};