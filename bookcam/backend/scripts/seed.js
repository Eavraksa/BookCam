// Usage (from the backend folder):  npm run seed
// Adds sample categories and books (no cover images) so the storefront isn't empty.
// Safe to re-run: documents use fixed IDs and are overwritten.
require('dotenv').config();
const { admin, db } = require('../src/firebase');

const now = admin.firestore.FieldValue.serverTimestamp();

const categories = [
  { id: 'classics', name: 'Classics', description: 'Timeless works of literature' },
  { id: 'philosophy', name: 'Philosophy', description: 'Ideas that shaped how we think' },
  { id: 'children', name: "Children's", description: 'Stories for young readers' },
];

const books = [
  ['pride-and-prejudice', 'Pride and Prejudice', 'Jane Austen', 'classics', 9.99, 25],
  ['frankenstein', 'Frankenstein', 'Mary Shelley', 'classics', 8.5, 18],
  ['moby-dick', 'Moby-Dick', 'Herman Melville', 'classics', 12.75, 12],
  ['meditations', 'Meditations', 'Marcus Aurelius', 'philosophy', 10.0, 30],
  ['art-of-war', 'The Art of War', 'Sun Tzu', 'philosophy', 7.25, 40],
  ['alice', "Alice's Adventures in Wonderland", 'Lewis Carroll', 'children', 6.99, 35],
  ['treasure-island', 'Treasure Island', 'Robert Louis Stevenson', 'children', 7.99, 22],
];

async function main() {
  const batch = db.batch();

  categories.forEach(({ id, ...data }) => {
    batch.set(db.collection('categories').doc(id), { ...data, createdAt: now, updatedAt: now });
  });

  books.forEach(([id, title, author, categoryId, price, stock]) => {
    batch.set(db.collection('books').doc(id), {
      title,
      author,
      categoryId,
      price,
      stock,
      isbn: '',
      description: `${title} by ${author}. A sample entry created by the seed script.`,
      coverUrl: '',
      coverPath: '',
      createdAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
  console.log(`Seeded ${categories.length} categories and ${books.length} books.`);
}

main().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
