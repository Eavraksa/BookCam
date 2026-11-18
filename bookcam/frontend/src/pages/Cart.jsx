import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, BookCover, EmptyState, Spinner } from '../components/Ui';
import { MAX_QTY, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';
import { getBook } from '../services/firestore';
import { formatPrice } from '../utils/format';

const emptyShipping = { fullName: '', phone: '', address: '', city: '', postalCode: '' };

export default function Cart() {
  const { user } = useAuth();
  const { items, setQuantity, removeItem, error: cartError } = useCart();
  const navigate = useNavigate();
  const [books, setBooks] = useState({}); // bookId -> book (null if deleted)
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState({ ...emptyShipping, fullName: user?.displayName || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load details for books in the cart that we haven't fetched yet
  useEffect(() => {
    const missing = items.filter((i) => !(i.bookId in books));
    if (missing.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(missing.map((i) => getBook(i.bookId).catch(() => null))).then((results) => {
      setBooks((prev) => ({
        ...prev,
        ...Object.fromEntries(missing.map((i, idx) => [i.bookId, results[idx]])),
      }));
      setLoading(false);
    });
  }, [items, books]);

  const lines = useMemo(
    () => items.map((i) => ({ ...i, book: books[i.bookId] })).filter((l) => l.book),
    [items, books]
  );
  const total = lines.reduce((sum, l) => sum + l.book.price * l.quantity, 0);
  const set = (key) => (e) => setShipping({ ...shipping, [key]: e.target.value });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await ordersApi.create({
        items: lines.map((l) => ({ bookId: l.bookId, quantity: l.quantity })),
        shippingAddress: shipping,
      });
      navigate('/orders', { state: { placed: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length > 0) return <Spinner />;
  if (lines.length === 0) {
    return (
      <EmptyState>
        Your cart is empty. <Link to="/" className="text-amber-700 underline">Browse books</Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Your cart</h1>
      <Alert>{cartError}</Alert>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {lines.map(({ book, quantity }) => (
            <div key={book.id} className="card flex gap-4 p-4">
              <BookCover book={book} className="h-24 w-16 shrink-0 rounded" />
              <div className="flex-1">
                <Link to={`/books/${book.id}`} className="font-semibold hover:text-amber-700">{book.title}</Link>
                <p className="text-sm text-stone-500">{book.author}</p>
                <p className="mt-1 text-sm">{formatPrice(book.price)}</p>
                {quantity > book.stock && (
                  <p className="mt-1 text-sm text-red-600">Only {book.stock} in stock — reduce the quantity.</p>
                )}
              </div>
              <div className="flex flex-col items-end justify-between">
                <input
                  type="number"
                  min="1"
                  max={MAX_QTY}
                  value={quantity}
                  onChange={(e) => setQuantity(book.id, Number(e.target.value) || 1)}
                  className="input w-20"
                  aria-label={`Quantity for ${book.title}`}
                />
                <button onClick={() => removeItem(book.id)} className="text-sm text-red-600 hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleCheckout} className="card h-fit space-y-3 p-5">
          <h2 className="text-lg font-semibold">Shipping details</h2>
          <Alert>{error}</Alert>
          <input required className="input" placeholder="Full name" value={shipping.fullName} onChange={set('fullName')} />
          <input required className="input" placeholder="Phone" value={shipping.phone} onChange={set('phone')} />
          <input required className="input" placeholder="Address" value={shipping.address} onChange={set('address')} />
          <div className="grid grid-cols-2 gap-3">
            <input required className="input" placeholder="City" value={shipping.city} onChange={set('city')} />
            <input className="input" placeholder="Postal code" value={shipping.postalCode} onChange={set('postalCode')} />
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button className="btn-primary w-full" disabled={busy || lines.some((l) => l.quantity > l.book.stock)}>
            {busy ? 'Placing order…' : 'Place order'}
          </button>
          <p className="text-xs text-stone-500">The final price is confirmed by the server when you place the order.</p>
        </form>
      </div>
    </div>
  );
}
