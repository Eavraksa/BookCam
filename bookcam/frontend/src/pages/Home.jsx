import { useEffect, useMemo, useState } from 'react';
import BookCard from '../components/BookCard';
import { Alert, EmptyState, Spinner } from '../components/Ui';
import { getBooks, getCategories } from '../services/firestore';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getBooks(), getCategories()])
      .then(([b, c]) => {
        setBooks(b);
        setCategories(c);
      })
      .catch(() => setError('Could not load books. Check your Firebase configuration and rules.'))
      .finally(() => setLoading(false));
  }, []);

  const categoryNames = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter(
      (b) =>
        (!categoryId || b.categoryId === categoryId) &&
        (!q || `${b.title} ${b.author} ${b.isbn || ''}`.toLowerCase().includes(q))
    );
  }, [books, search, categoryId]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Browse books</h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="input sm:max-w-sm"
          placeholder="Search by title, author or ISBN"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input sm:max-w-xs" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <Alert>{error}</Alert>
        {loading ? (
          <Spinner />
        ) : visible.length === 0 && !error ? (
          <EmptyState>No books found.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((book) => (
              <BookCard key={book.id} book={book} categoryName={categoryNames[book.categoryId]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
