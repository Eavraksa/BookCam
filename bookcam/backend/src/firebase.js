const admin = require('firebase-admin');

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET,
} = process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase Admin credentials. Copy backend/.env.example to backend/.env and fill in ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // .env files store newlines as the two characters "\n"
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = FIREBASE_STORAGE_BUCKET ? admin.storage().bucket() : null;

module.exports = { admin, db, auth, bucket };
