import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, BookCover, EmptyState, Spinner } from '../../components/Ui';
import { booksApi, categoriesApi } from '../../services/api';
import { formatPrice } from '../../utils/format';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([booksApi.list(), categoriesApi.list()])
      .then(([b, c]) => {
        setBooks(b);
        setCategories(Object.fromEntries(c.map((x) => [x.id, x.name])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const remove = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This also removes its cover image.`)) return;
    setError('');
    try {
      await booksApi.remove(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Books ({books.length})</h2>
        <Link to="/admin/books/new" className="btn-primary">+ Add book</Link>
      </div>
      <div className="mt-4"><Alert>{error}</Alert></div>
      {books.length === 0 ? (
        <div className="mt-4"><EmptyState>No books yet.</EmptyState></div>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="p-3">Cover</th><th className="p-3">Title</th><th className="p-3">Category</th>
                <th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {books.map((b) => (
                <tr key={b.id}>
                  <td className="p-3"><BookCover book={b} className="h-14 w-10 rounded" /></td>
                  <td className="p-3"><div className="font-medium">{b.title}</div><div className="text-stone-500">{b.author}</div></td>
                  <td className="p-3">{categories[b.categoryId] || '—'}</td>
                  <td className="p-3">{formatPrice(b.price)}</td>
                  <td className="p-3">{b.stock}</td>
                  <td className="space-x-3 p-3 text-right">
                    <Link to={`/admin/books/${b.id}/edit`} className="text-amber-700 hover:underline">Edit</Link>
                    <button onClick={() => remove(b)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
