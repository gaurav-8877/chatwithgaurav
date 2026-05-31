import { ENV } from "./env.js";

/**
 * Verifies a Firebase ID token using Google's Identity Toolkit REST API.
 * No firebase-admin SDK needed — just the Web API Key.
 *
 * Returns: { uid, phoneNumber, displayName, ... }
 * Throws on invalid token.
 */
export async function verifyFirebaseIdToken(idToken) {
  const apiKey = ENV.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY is not set in backend .env");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Firebase token invalid: ${data.error.message}`);
  }

  if (!data.users || data.users.length === 0) {
    throw new Error("Firebase: no user found for this token");
  }

  return data.users[0]; // { localId (uid), phoneNumber, displayName, ... }
}
