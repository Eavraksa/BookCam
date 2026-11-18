const router = require('express').Router();
const { admin, db } = require('../firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, HttpError, docToJson } = require('../utils/http');
const v = require('../utils/validate');

const orders = db.collection('orders');
const books = db.collection('books');
const carts = db.collection('carts');
const { FieldValue } = admin.firestore;

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const MAX_LINES = 50;
const MAX_QTY = 20;

function parseShipping(body = {}) {
  return {
    fullName: v.reqString(body.fullName, 'fullName', { max: 100 }),
    phone: v.reqString(body.phone, 'phone', { min: 5, max: 30 }),
    address: v.reqString(body.address, 'address', { max: 300 }),
    city: v.reqString(body.city, 'city', { max: 100 }),
    postalCode: v.optString(body.postalCode, 'postalCode', { max: 20 }),
  };
}

// Only bookId + quantity are trusted from the client. Prices come from Firestore.
function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'An order must contain at least one item');
  }
  if (items.length > MAX_LINES) throw new HttpError(400, 'Too many items in one order');

  const merged = new Map();
  for (const item of items) {
    const bookId = v.docId(item && item.bookId, 'bookId');
    const quantity = v.number(item && item.quantity, 'quantity', {
      min: 1,
      max: MAX_QTY,
      integer: true,
    });
    const total = (merged.get(bookId) || 0) + quantity;
    if (total > MAX_QTY) throw new HttpError(400, `You can order at most ${MAX_QTY} copies of a book`);
    merged.set(bookId, total);
  }
  return [...merged].map(([bookId, quantity]) => ({ bookId, quantity }));
}

/**
 * Changes an order's status inside a transaction.
 * Cancelling restores the reserved stock. Customers may only cancel their own pending orders.
 */
async function changeStatus(orderId, newStatus, actor) {
  const orderRef = orders.doc(orderId);

  await db.runTransaction(async (t) => {
    const orderSnap = await t.get(orderRef);
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found');
    const order = orderSnap.data();

    if (actor.role !== 'admin') {
      if (order.userId !== actor.uid) throw new HttpError(404, 'Order not found');
      if (order.status !== 'pending' || newStatus !== 'cancelled') {
        throw new HttpError(409, 'Only pending orders can be cancelled');
      }
    }
    if (order.status === 'cancelled') throw new HttpError(409, 'Cancelled orders cannot be changed');
    if (order.status === newStatus) return;

    // All reads must happen before any writes in a Firestore transaction.
    let bookSnaps = [];
    if (newStatus === 'cancelled' && order.items.length > 0) {
      bookSnaps = await t.getAll(...order.items.map((i) => books.doc(i.bookId)));
    }

    bookSnaps.forEach((snap, idx) => {
      if (snap.exists) t.update(snap.ref, { stock: FieldValue.increment(order.items[idx].quantity) });
    });
    t.update(orderRef, { status: newStatus, updatedAt: FieldValue.serverTimestamp() });
  });
}

// CREATE - customer places an order (totals and stock are handled server-side)
router.post(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const items = parseItems(req.body.items);
    const shippingAddress = parseShipping(req.body.shippingAddress);
    const orderRef = orders.doc();

    await db.runTransaction(async (t) => {
      const snaps = await t.getAll(...items.map((i) => books.doc(i.bookId)));

      const lines = [];
      let total = 0;
      snaps.forEach((snap, idx) => {
        const { quantity } = items[idx];
        if (!snap.exists) throw new HttpError(409, 'A book in your cart is no longer available');
        const book = snap.data();
        if (book.stock < quantity) {
          throw new HttpError(409, `Only ${book.stock} copies of "${book.title}" are left in stock`);
        }
        lines.push({
          bookId: snap.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl || '',
          price: book.price,
          quantity,
        });
        total += book.price * quantity;
      });

      snaps.forEach((snap, idx) => {
        t.update(snap.ref, { stock: snap.data().stock - items[idx].quantity });
      });
      t.set(orderRef, {
        userId: req.user.uid,
        userEmail: req.user.email,
        items: lines,
        total: Math.round(total * 100) / 100,
        status: 'pending',
        shippingAddress,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      t.delete(carts.doc(req.user.uid)); // empty the customer's cart
    });

    res.status(201).json(docToJson(await orderRef.get()));
  })
);

// READ - my orders (newest first)
router.get(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const snap = await orders.where('userId', '==', req.user.uid).get();
    const list = snap.docs.map(docToJson);
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json(list);
  })
);

// READ - all orders (admin), optional ?status=
router.get(
  '/admin/all',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const snap = await orders.orderBy('createdAt', 'desc').get();
    let list = snap.docs.map(docToJson);
    if (req.query.status) list = list.filter((o) => o.status === req.query.status);
    res.json(list);
  })
);

// READ - one order (owner or admin)
router.get(
  '/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    const snap = await orders.doc(v.docId(req.params.id)).get();
    if (!snap.exists) throw new HttpError(404, 'Order not found');
    const order = snap.data();
    if (req.user.role !== 'admin' && order.userId !== req.user.uid) {
      throw new HttpError(404, 'Order not found');
    }
    res.json(docToJson(snap));
  })
);

// UPDATE - customer cancels own pending order
router.post(
  '/:id/cancel',
  verifyToken,
  asyncHandler(async (req, res) => {
    const id = v.docId(req.params.id);
    await changeStatus(id, 'cancelled', req.user);
    res.json(docToJson(await orders.doc(id).get()));
  })
);

// UPDATE - admin changes status
router.patch(
  '/:id/status',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = v.docId(req.params.id);
    const status = req.body && req.body.status;
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
    }
    await changeStatus(id, status, req.user);
    res.json(docToJson(await orders.doc(id).get()));
  })
);

// DELETE - admin removes finished (delivered / cancelled) orders only
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = orders.doc(v.docId(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Order not found');
    if (!['delivered', 'cancelled'].includes(snap.data().status)) {
      throw new HttpError(409, 'Only delivered or cancelled orders can be deleted');
    }
    await ref.delete();
    res.status(204).end();
  })
);

module.exports = router;
