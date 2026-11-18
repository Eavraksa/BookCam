const router = require('express').Router();
const { admin, db, auth } = require('../firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, HttpError, docToJson } = require('../utils/http');
const v = require('../utils/validate');

const users = db.collection('users');
const { FieldValue } = admin.firestore;

// READ - my profile
router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const snap = await users.doc(req.user.uid).get();
    const profile = snap.exists ? docToJson(snap) : { id: req.user.uid, email: req.user.email };
    res.json({ ...profile, role: req.user.role });
  })
);

// UPDATE - my profile (name / phone only; role can never be changed here)
router.patch(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const update = { updatedAt: FieldValue.serverTimestamp() };
    if (req.body.displayName !== undefined) {
      update.displayName = v.reqString(req.body.displayName, 'displayName', { max: 100 });
    }
    if (req.body.phone !== undefined) {
      update.phone = v.optString(req.body.phone, 'phone', { max: 30 });
    }
    await users.doc(req.user.uid).set(update, { merge: true });
    if (update.displayName) await auth.updateUser(req.user.uid, { displayName: update.displayName });
    res.json(docToJson(await users.doc(req.user.uid).get()));
  })
);

// READ - all users (admin)
router.get(
  '/',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const snap = await users.orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(docToJson));
  })
);

// UPDATE - change a user's role (admin). Sets the signed custom claim used by
// the backend, Firestore rules and Storage rules, then mirrors it in the users doc.
router.patch(
  '/:uid/role',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const uid = v.docId(req.params.uid, 'uid');
    const role = req.body && req.body.role;
    if (!['admin', 'customer'].includes(role)) {
      throw new HttpError(400, 'role must be "admin" or "customer"');
    }
    if (uid === req.user.uid) throw new HttpError(400, 'You cannot change your own role');

    await auth.getUser(uid); // throws auth/user-not-found -> 404
    await auth.setCustomUserClaims(uid, { role });
    await auth.revokeRefreshTokens(uid); // forces re-login so the new claim takes effect
    await users.doc(uid).set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    res.json(docToJson(await users.doc(uid).get()));
  })
);

// DELETE - remove a user account, profile and cart (admin). Orders are kept for records.
router.delete(
  '/:uid',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const uid = v.docId(req.params.uid, 'uid');
    if (uid === req.user.uid) throw new HttpError(400, 'You cannot delete your own account');

    try {
      await auth.deleteUser(uid);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }
    await Promise.all([users.doc(uid).delete(), db.collection('carts').doc(uid).delete()]);
    res.status(204).end();
  })
);

module.exports = router;
