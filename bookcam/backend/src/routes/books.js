const router = require('express').Router();
const { admin, db, bucket } = require('../firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, HttpError, docToJson } = require('../utils/http');
const v = require('../utils/validate');

const books = db.collection('books');
const categories = db.collection('categories');
const { FieldValue } = admin.firestore;

async function parseBook(body = {}) {
  const categoryId = v.docId(body.categoryId, 'categoryId');
  if (!(await categories.doc(categoryId).get()).exists) {
    throw new HttpError(400, 'Category does not exist');
  }

  const coverPath = v.optString(body.coverPath, 'coverPath', { max: 300 });
  if (coverPath && !/^book-covers\/[^/]+$/.test(coverPath)) {
    throw new HttpError(400, 'Invalid coverPath');
  }
  const coverUrl = v.optString(body.coverUrl, 'coverUrl', { max: 1500 });
  if (coverUrl && !/^https:\/\//.test(coverUrl)) {
    throw new HttpError(400, 'coverUrl must be an https URL');
  }

  return {
    title: v.reqString(body.title, 'title', { max: 200 }),
    author: v.reqString(body.author, 'author', { max: 150 }),
    isbn: v.optString(body.isbn, 'isbn', { max: 20 }),
    description: v.optString(body.description, 'description', { max: 5000 }),
    price: Math.round(v.number(body.price, 'price', { min: 0, max: 100000 }) * 100) / 100,
    stock: v.number(body.stock, 'stock', { min: 0, max: 100000, integer: true }),
    categoryId,
    coverUrl,
    coverPath,
  };
}

async function deleteCover(path) {
  if (!path || !bucket) return;
  try {
    await bucket.file(path).delete({ ignoreNotFound: true });
  } catch (err) {
    console.warn(`Could not delete cover image "${path}": ${err.message}`);
  }
}

// READ list (public) - optional ?category=<id>&q=<text>
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let query = books.orderBy('createdAt', 'desc');
    if (req.query.category) {
      query = books
        .where('categoryId', '==', v.docId(String(req.query.category), 'category'))
        .orderBy('createdAt', 'desc');
    }
    let list = (await query.get()).docs.map(docToJson);
    const q = String(req.query.q || '').trim().toLowerCase();
    if (q) {
      list = list.filter((b) => `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(q));
    }
    res.json(list);
  })
);

// READ one (public)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const snap = await books.doc(v.docId(req.params.id)).get();
    if (!snap.exists) throw new HttpError(404, 'Book not found');
    res.json(docToJson(snap));
  })
);

// CREATE (admin)
router.post(
  '/',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = await parseBook(req.body);
    const ref = await books.add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json(docToJson(await ref.get()));
  })
);

// UPDATE (admin) - replaces the old cover image in Storage if a new one was supplied
router.put(
  '/:id',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = books.doc(v.docId(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Book not found');

    const data = await parseBook(req.body);
    await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });

    const oldPath = snap.data().coverPath;
    if (oldPath && oldPath !== data.coverPath) await deleteCover(oldPath);

    res.json(docToJson(await ref.get()));
  })
);

// DELETE (admin) - also removes the cover image from Storage
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = books.doc(v.docId(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Book not found');
    await ref.delete();
    await deleteCover(snap.data().coverPath);
    res.status(204).end();
  })
);

module.exports = router;
