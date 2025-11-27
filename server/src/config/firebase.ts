import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

console.log('[Firebase Config] Checking environment variables...');
console.log('[Firebase Config] FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('[Firebase Config] FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing');
console.log('[Firebase Config] FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '✗ Missing');

// Verificar que las variables requeridas estén presentes
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('[Firebase Config] ❌ ERROR: Missing required Firebase environment variables');
  console.error('[Firebase Config] Please check your .env file');
  throw new Error('Firebase configuration is incomplete. Check your .env file.');
}

// Preparar la clave privada (reemplazar \\n con saltos de línea reales)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: privateKey,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

console.log('[Firebase Config] Service account prepared:');
console.log('[Firebase Config]   - Project ID:', serviceAccount.projectId);
console.log('[Firebase Config]   - Client Email:', serviceAccount.clientEmail);
console.log('[Firebase Config]   - Private Key:', privateKey.substring(0, 50) + '...');

try {
  // Verificar si ya está inicializado
  if (!admin.apps.length) {
    console.log('[Firebase Config] Initializing Firebase Admin...');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    
    console.log('[Firebase Config] ✅ Firebase Admin initialized successfully');
  } else {
    console.log('[Firebase Config] ✓ Firebase Admin already initialized');
  }
} catch (error) {
  console.error('[Firebase Config] ❌ Firebase Admin initialization error:');
  console.error(error);
  throw error;
}

// Exportar la instancia de Firestore
export const db = admin.firestore();

console.log('[Firebase Config] ✓ Firestore instance created');