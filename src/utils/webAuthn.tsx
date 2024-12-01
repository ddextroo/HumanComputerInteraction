import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

/**
 * Checks if the device supports WebAuthn and fingerprint authentication.
 * @returns Promise<boolean>
 */
/**
 * Check if WebAuthn and fingerprint authentication are supported.
 * @returns Promise<boolean> indicating whether fingerprint authentication is supported.
 */
export async function isFingerprintSupported(): Promise<boolean> {
  // Check if the browser supports WebAuthn
  if ("PublicKeyCredential" in window) {
    // Check if the device supports user-verifying platform authenticators (like fingerprints)
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }
  return false;
}

/**
 * Register a fingerprint for a user.
 * @param username The username of the user registering their fingerprint.
 */
export async function registerFingerprint(username: string) {
  try {
    const fingerprintSupported = await isFingerprintSupported();
    if (!fingerprintSupported) {
      throw new Error(
        "Fingerprint authentication is not supported on this device."
      );
    }

    const options = await fetch(
      "http://localhost:3000/api/auth/webauthn/register-options",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      }
    ).then((res) => res.json());

    const attestationResponse = await startRegistration(options);

    const verificationResponse = await fetch(
      "http://localhost:3000/api/auth/webauthn/verify-registration",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          attestationResponse,
        }),
      }
    );

    if (verificationResponse.ok) {
      return await verificationResponse.json();
    } else {
      throw new Error("Failed to verify registration");
    }
  } catch (error) {
    console.error("Error during fingerprint registration:", error);
    throw error;
  }
}

/**
 * Authenticate a user using their fingerprint.
 * @param username The username of the user.
 */
export async function authenticateFingerprint(username: string) {
  try {
    const fingerprintSupported = await isFingerprintSupported();
    if (!fingerprintSupported) {
      throw new Error(
        "Fingerprint authentication is not supported on this device."
      );
    }

    const options = await fetch(
      "http://localhost:3000/api/auth/webauthn/authentication-options",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      }
    ).then((res) => res.json());

    const assertionResponse = await startAuthentication(options);

    const verificationResponse = await fetch(
      "http://localhost:3000/api/auth/webauthn/verify-authentication",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          assertionResponse,
        }),
      }
    );

    if (verificationResponse.ok) {
      return await verificationResponse.json();
    } else {
      throw new Error("Failed to verify authentication");
    }
  } catch (error) {
    console.error("Error during fingerprint authentication:", error);
    throw error;
  }
}
