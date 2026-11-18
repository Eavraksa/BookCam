// Usage (from the backend folder):  npm run make-admin -- someone@example.com
// Gives an EXISTING user (they must have registered first) the "admin" role.
require('dotenv').config();
const { admin, auth, db } = require('../src/firebase');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run make-admin -- user@example.com');
    process.exit(1);
  }

  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role: 'admin' });
  const ref = db.collection('users').doc(user.uid);
  const existing = await ref.get();
  await ref.set(
      {
        ...(existing.exists && existing.data().createdAt
          ? {}
          : { createdAt: admin.firestore.Timestamp.fromDate(new Date(user.metadata.creationTime)) }),
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log(`${email} is now an admin. Ask them to sign out and sign in again.`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
