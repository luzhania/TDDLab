import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log("Initializing Firebase Admin...");
console.log("Current working directory:", process.cwd());
console.log("FIREBASE_PROJECT_ID exists:", !!process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL exists:", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);

// Check if required environment variables are set
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error("CRITICAL: Firebase Admin environment variables are missing. Firestore will not be initialized correctly.");
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully with project ID:", serviceAccount.projectId);
  } else {
    console.log("Firebase Admin already initialized.");
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // Re-throw the error to prevent the application from starting with an invalid DB connection
  throw error;
}

export const db = admin.firestore();
