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
import { server, client } from "@passwordless-id/webauthn";

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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      idnumber TEXT NOT NULL UNIQUE,
      contact TEXT NOT NULL,
      birthdate TEXT NOT NULL,
      gender TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      civilstatus TEXT NOT NULL,
      address TEXT NOT NULL,
      currentChallenge TEXT,
    )
  `);
}

initDb();

async function saveUser(user) {
  const {
    firstname,
    lastname,
    idnumber,
    contact,
    birthdate,
    gender,
    email,
    civilstatus,
    address,
    currentChallenge,
  } = user;

  await db.run(
    `INSERT OR REPLACE INTO users (
      firstname, lastname, idnumber, contact, birthdate, gender,
      email, civilstatus, address, currentChallenge
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      firstname,
      lastname,
      idnumber,
      contact,
      birthdate,
      gender,
      email,
      civilstatus,
      address,
      currentChallenge,
    ]
  );
}

async function getUserByEmail(email) {
  const row = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);

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
    currentChallenge: row.currentChallenge,
    authenticatorData: row.authenticatorData
      ? JSON.parse(row.authenticatorData)
      : null,
  };
}

app.post("/api/register", async (req, res) => {
  const {
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

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email." });
  }

  let user = await getUserByEmail(email);
  if (user?.authenticatorData) {
    return res.status(400).json({ error: "User already registered" });
  }

  const challenge = server.randomChallenge();
  await client.register({
    challenge: "a random base64url encoded buffer from the server",
    user: `${firstname} ${lastname}`,
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
    currentChallenge: challenge ? JSON.parse(row.authenticatorData) : null,
  };

  await saveUser(user);

  res.json(options);
});

app.post("/api/login", async (req, res) => {
  const { challenge } = req.body;

  const user = await getUserByChallenge(challenge);
  if (!user || !user.authenticatorData) {
    return res.status(404).json({ error: "User not found or not registered" });
  }

  try {
    await client.authenticate({
      challenge: challenge,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Authentication failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
