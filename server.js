import express from "express";
import cors from "cors";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from your frontend
    methods: ["GET", "POST"], // Allow these methods
    credentials: true, // Allow credentials if needed
  })
);

app.use(express.json());

let db;
const dbName = "users.db";

async function initDb() {
  db = await open({
    filename: dbName,
    driver: sqlite3.Database,
  });

  // Create users table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      devices TEXT,  -- Store devices as a JSON string
      currentChallenge TEXT
    )
  `);
}

initDb();

async function saveUser(username, data) {
  const { devices, currentChallenge } = data;
  await db.run(
    `INSERT OR REPLACE INTO users (id, devices, currentChallenge)
     VALUES (?, ?, ?)`,
    [username, JSON.stringify(devices), currentChallenge]
  );
}

// Get a user from the database
async function getUser(username) {
  const row = await db.get(`SELECT * FROM users WHERE id = ?`, [username]);
  return row
    ? {
        id: row.id,
        devices: JSON.parse(row.devices),
        currentChallenge: row.currentChallenge,
      }
    : null;
}

// Endpoint to register options (generate challenge)
app.post("/api/auth/webauthn/register-options", async (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== "string" || username.length < 3) {
    return res.status(400).send("Invalid username.");
  }

  let user = await getUser(username);
  if (!user) {
    user = { id: username, devices: [], currentChallenge: "" };
  }

  const options = generateRegistrationOptions({
    rpName: "Your App Name",
    rpID: "localhost",
    userID: isoUint8Array.fromUTF8String(username),
    userName: username,
  });

  user.currentChallenge = options.challenge;

  await saveUser(username, user);

  res.json({ options });
});

// Endpoint to verify registration response (attestation)
app.post("/api/auth/webauthn/verify-registration", async (req, res) => {
  const { username, attestationResponse } = req.body;

  if (!attestationResponse || !username) {
    return res.status(400).send("Missing username or attestation response.");
  }

  const user = await getUser(username);
  if (!user) return res.status(404).send("User not found");

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge: user.currentChallenge,
    expectedRPID: "localhost",
  });

  if (verification.verified) {
    user.devices.push(verification.registrationInfo);
    await saveUser(username, user);
    res.send({ success: true });
  } else {
    res.status(400).send("Verification failed");
  }
});

// Endpoint to generate authentication options (login challenge)
app.post("/api/auth/webauthn/authentication-options", async (req, res) => {
  const user = await getUser(req.body.username);

  if (!user) return res.status(404).send("User not found");

  const options = generateAuthenticationOptions({
    allowCredentials: user.devices.map((device) => ({
      id: device.credentialID,
      type: "public-key",
    })),
  });

  user.currentChallenge = options.challenge;
  await saveUser(req.body.username, user);

  res.json(options);
});

// Endpoint to verify authentication response (login verification)
app.post("/api/auth/webauthn/verify-authentication", async (req, res) => {
  const { username, assertionResponse } = req.body;

  if (!assertionResponse || !username) {
    return res.status(400).send("Missing username or assertion response.");
  }

  const user = await getUser(username);

  if (!user) return res.status(404).send("User not found");

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: user.currentChallenge,
    expectedRPID: "localhost",
    authenticator: user.devices.find(
      (device) => device.credentialID === assertionResponse.rawId
    ),
  });

  if (verification.verified) {
    res.send({ success: true });
  } else {
    res.status(400).send("Authentication failed");
  }
});

// Endpoint to check if the device supports fingerprint authentication
app.post("/api/auth/webauthn/check-fingerprint-support", (req, res) => {
  if ("PublicKeyCredential" in window) {
    // Check if device supports WebAuthn
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
      res.json({
        success: true,
        message:
          "Fingerprint (or other biometric) authentication is supported on this device.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No biometric authentication available.",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "WebAuthn not supported on this device.",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
