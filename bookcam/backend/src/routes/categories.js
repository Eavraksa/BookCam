const router = require('express').Router();
const { admin, db } = require('../firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, HttpError, docToJson } = require('../utils/http');
const v = require('../utils/validate');

const categories = db.collection('categories');
const books = db.collection('books');
const { FieldValue } = admin.firestore;

async function parseCategory(body = {}, ignoreId = null) {
  const name = v.reqString(body.name, 'name', { max: 60 });
  const description = v.optString(body.description, 'description', { max: 300 });

  const dup = await categories.where('name', '==', name).limit(2).get();
  if (dup.docs.some((d) => d.id !== ignoreId)) {
    throw new HttpError(409, 'A category with this name already exists');
  }
  return { name, description };
}

// READ (public)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const snap = await categories.orderBy('name').get();
    res.json(snap.docs.map(docToJson));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const snap = await categories.doc(v.docId(req.params.id)).get();
    if (!snap.exists) throw new HttpError(404, 'Category not found');
    res.json(docToJson(snap));
  })
);

// CREATE (admin)
router.post(
  '/',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = await parseCategory(req.body);
    const ref = await categories.add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json(docToJson(await ref.get()));
  })
);

// UPDATE (admin)
router.put(
  '/:id',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = categories.doc(v.docId(req.params.id));
    if (!(await ref.get()).exists) throw new HttpError(404, 'Category not found');
    const data = await parseCategory(req.body, ref.id);
    await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    res.json(docToJson(await ref.get()));
  })
);

// DELETE (admin) - refused while books still use the category
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = categories.doc(v.docId(req.params.id));
    if (!(await ref.get()).exists) throw new HttpError(404, 'Category not found');
    const inUse = await books.where('categoryId', '==', ref.id).limit(1).get();
    if (!inUse.empty) {
      throw new HttpError(409, 'Cannot delete a category that still contains books');
    }
    await ref.delete();
    res.status(204).end();
  })
);

module.exports = router;
