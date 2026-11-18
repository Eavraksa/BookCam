import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { saveCart, subscribeToCart } from '../services/firestore';

const CartContext = createContext(null);
const MAX_QTY = 20;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // [{ bookId, quantity }]
  const [error, setError] = useState('');

  // Live-sync the signed-in user's cart document (carts/{uid})
  useEffect(() => {
    if (!user) {
      setItems([]);
      return undefined;
    }
    return subscribeToCart(
      user.uid,
      (next) => setItems(next),
      () => setError('Could not load your cart.')
    );
  }, [user]);

  const persist = async (next) => {
    setItems(next); // optimistic
    setError('');
    try {
      await saveCart(user.uid, next);
    } catch {
      setError('Could not save your cart. Please try again.');
    }
  };

  const value = useMemo(
    () => ({
      items,
      error,
      count: items.reduce((sum, i) => sum + i.quantity, 0),

      addItem(bookId, quantity = 1) {
        const existing = items.find((i) => i.bookId === bookId);
        const next = existing
          ? items.map((i) =>
              i.bookId === bookId ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) } : i
            )
          : [...items, { bookId, quantity: Math.min(quantity, MAX_QTY) }];
        return persist(next);
      },

      setQuantity(bookId, quantity) {
        const q = Math.max(1, Math.min(quantity, MAX_QTY));
        return persist(items.map((i) => (i.bookId === bookId ? { ...i, quantity: q } : i)));
      },

      removeItem: (bookId) => persist(items.filter((i) => i.bookId !== bookId)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, error, user]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export { MAX_QTY };
