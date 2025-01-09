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
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

let db;
const dbName = "users.db";

// WebAuthn configuration
const rpName = "Your App Name";
const rpID = "localhost";
const origin = `http://${rpID}:5173`;

async function initDb() {
  db = await open({
    filename: dbName,
    driver: sqlite3.Database,
  });

  // Create users table with authenticator data
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      idnumber TEXT NOT NULL UNIQUE,
      contact TEXT NOT NULL,
      birthdate TEXT NOT NULL,
      gender TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      civilstatus TEXT NOT NULL,
      address TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      currentChallenge TEXT,
      authenticatorData TEXT
    )
  `);
}

initDb();

async function saveUser(user) {
  const {
    id,
    firstname,
    lastname,
    idnumber,
    contact,
    birthdate,
    gender,
    email,
    civilstatus,
    address,
    username,
    currentChallenge,
    authenticatorData,
  } = user;

  await db.run(
    `INSERT OR REPLACE INTO users (
      id, firstname, lastname, idnumber, contact, birthdate, gender,
      email, civilstatus, address, username, currentChallenge, authenticatorData
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      firstname,
      lastname,
      idnumber,
      contact,
      birthdate,
      gender,
      email,
      civilstatus,
      address,
      username,
      currentChallenge,
      authenticatorData ? JSON.stringify(authenticatorData) : null,
    ]
  );
}

async function getUser(username) {
  const row = await db.get(`SELECT * FROM users WHERE username = ?`, [
    username,
  ]);

  if (!row) return null;

  return {
    firstname: row.firstname,
    lastname: row.lastname,
    idnumber: row.idnumber,
    contact: row.contact,
    birthdate: row.birthdate,
    gender: row.gender,
    email: row.email,
    civilstatus: row.civilstatus,
    address: row.address,
    username: row.username,
    currentChallenge: row.currentChallenge,
    authenticatorData: row.authenticatorData
      ? JSON.parse(row.authenticatorData)
      : null,
  };
}

app.post("/api/auth/webauthn/register-options", async (req, res) => {
  const {
    username,
    firstname,
    lastname,
    idnumber,
    contact,
    birthdate,
    gender,
    email,
    civilstatus,
    address,
  } = req.body;

  if (!username || typeof username !== "string" || username.length < 3) {
    return res.status(400).json({ error: "Invalid username." });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email." });
  }

  let user = await getUser(username);
  if (user?.authenticatorData) {
    return res.status(400).json({ error: "User already registered" });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: username,
    userName: username,
    userDisplayName: `${firstname} ${lastname}`,
    attestationType: "direct",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
  });

  user = {
    firstname,
    lastname,
    idnumber,
    contact,
    birthdate,
    gender,
    email,
    civilstatus,
    address,
    username,
    currentChallenge: options.challenge,
  };

  await saveUser(user);

  res.json(options);
});

app.post("/api/auth/webauthn/verify-registration", async (req, res) => {
  const { username, attestationResponse } = req.body;

  if (!attestationResponse || !username) {
    return res
      .status(400)
      .json({ error: "Missing username or attestation response." });
  }

  const user = await getUser(username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } =
        verification.registrationInfo;

      user.authenticatorData = {
        credentialID: Buffer.from(credentialID).toString("base64url"),
        credentialPublicKey:
          Buffer.from(credentialPublicKey).toString("base64url"),
        counter,
      };

      await saveUser(user);
      res.json({ verified: true });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Verification failed" });
  }
});

app.post("/api/auth/webauthn/authentication-options", async (req, res) => {
  const { username } = req.body;

  const user = await getUser(username);
  if (!user || !user.authenticatorData) {
    return res.status(404).json({ error: "User not found or not registered" });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: [
      {
        id: Buffer.from(user.authenticatorData.credentialID, "base64url"),
        type: "public-key",
      },
    ],
    userVerification: "required",
  });

  user.currentChallenge = options.challenge;
  await saveUser(user);

  res.json(options);
});

app.post("/api/auth/webauthn/verify-authentication", async (req, res) => {
  const { username, assertionResponse } = req.body;

  if (!assertionResponse || !username) {
    return res
      .status(400)
      .json({ error: "Missing username or assertion response." });
  }

  const user = await getUser(username);
  if (!user || !user.authenticatorData) {
    return res.status(404).json({ error: "User not found or not registered" });
  }

  try {
    const authenticator = {
      credentialID: Buffer.from(
        user.authenticatorData.credentialID,
        "base64url"
      ),
      credentialPublicKey: Buffer.from(
        user.authenticatorData.credentialPublicKey,
        "base64url"
      ),
      counter: user.authenticatorData.counter,
    };

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator,
    });

    if (verification.verified) {
      user.authenticatorData.counter =
        verification.authenticationInfo.newCounter;
      await saveUser(user);

      res.json({
        verified: true,
        user: {
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
        },
      });
    } else {
      res.status(400).json({ error: "Authentication failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Authentication failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
