import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, BookCover, Spinner } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { MAX_QTY, useCart } from '../context/CartContext';
import { getBook, getCategories } from '../services/firestore';
import { formatPrice } from '../utils/format';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    Promise.all([getBook(id), getCategories()])
      .then(([b, cats]) => {
        setBook(b);
        setCategoryName(cats.find((c) => c.id === b?.categoryId)?.name || '');
      })
      .catch(() => setError('Could not load this book.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (!book) return <Alert>Book not found. <Link to="/" className="underline">Back to books</Link></Alert>;

  const soldOut = book.stock <= 0;

  const handleAdd = async () => {
    if (!user) return navigate('/login', { state: { from: `/books/${id}` } });
    await addItem(book.id, qty);
    setAdded(true);
    return undefined;
  };

  return (
    <div>
      <Link to="/" className="text-sm text-amber-700 hover:underline">← All books</Link>
      <div className="card mt-4 grid gap-8 p-6 md:grid-cols-[280px_1fr]">
        <BookCover book={book} className="h-96 w-full rounded-md" />
        <div>
          {categoryName && <span className="text-xs uppercase tracking-wide text-amber-700">{categoryName}</span>}
          <h1 className="mt-1 text-3xl font-bold">{book.title}</h1>
          <p className="mt-1 text-stone-600">by {book.author}</p>
          {book.isbn && <p className="mt-1 text-sm text-stone-500">ISBN {book.isbn}</p>}
          <p className="mt-4 text-2xl font-semibold">{formatPrice(book.price)}</p>
          <p className={`mt-1 text-sm ${soldOut ? 'text-red-600' : 'text-green-700'}`}>
            {soldOut ? 'Out of stock' : `${book.stock} in stock`}
          </p>
          <p className="mt-4 whitespace-pre-line text-stone-700">{book.description || 'No description available.'}</p>

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={Math.min(MAX_QTY, book.stock || 1)}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value) || 1, MAX_QTY)))}
              className="input w-20"
              disabled={soldOut}
              aria-label="Quantity"
            />
            <button className="btn-primary" disabled={soldOut} onClick={handleAdd}>
              Add to cart
            </button>
            {added && <Link to="/cart" className="text-sm text-amber-700 underline">View cart</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
