import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateCover(file) {
  if (!ALLOWED_COVER_TYPES.includes(file.type)) return 'Cover must be a JPG, PNG, WebP or GIF image.';
  if (file.size > MAX_COVER_BYTES) return 'Cover image must be smaller than 5 MB.';
  return null;
}

// Uploads to Firebase Cloud Storage (allowed for admins only by storage.rules).
export async function uploadCover(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const coverPath = `book-covers/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, coverPath);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return { coverPath, coverUrl: await getDownloadURL(fileRef) };
}
