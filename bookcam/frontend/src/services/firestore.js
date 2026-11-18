// Direct Firestore access from the browser (read-only for books/categories; the owner's cart is read/write).
// Admin write operations go through the Express API instead (see api.js).
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Timestamps -> ISO strings so components can treat dates like the API does.
const clean = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v instanceof Timestamp ? v.toDate().toISOString() : v])
  );

const toObj = (snap) => ({ id: snap.id, ...clean(snap.data()) });

export async function getBooks() {
  const snap = await getDocs(query(collection(db, 'books'), orderBy('createdAt', 'desc')));
  return snap.docs.map(toObj);
}

export async function getBook(id) {
  const snap = await getDoc(doc(db, 'books', id));
  return snap.exists() ? toObj(snap) : null;
}

export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  return snap.docs.map(toObj);
}

// ---- Cart: carts/{uid} = { items: [{ bookId, quantity }], updatedAt } ----

export function subscribeToCart(uid, onItems, onError) {
  return onSnapshot(
    doc(db, 'carts', uid),
    (snap) => onItems(snap.exists() ? snap.data().items || [] : []),
    onError
  );
}

export function saveCart(uid, items) {
  return setDoc(doc(db, 'carts', uid), { items, updatedAt: serverTimestamp() });
}

// ---- Own profile ----

export async function ensureUserProfile(user, displayName) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || '',
    role: 'customer', // Firestore rules only allow "customer" here; admins are promoted by the backend
    createdAt: serverTimestamp(),
  });
}
