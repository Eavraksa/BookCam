import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, EmptyState, Spinner, StatusBadge } from '../components/Ui';
import { ordersApi } from '../services/api';
import { formatDate, formatPrice } from '../utils/format';

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    ordersApi
      .mine()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    setError('');
    try {
      await ordersApi.cancel(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold">My orders</h1>
      <div className="mt-4 space-y-4">
        {location.state?.placed && <Alert type="success">Thank you! Your order has been placed.</Alert>}
        <Alert>{error}</Alert>
        {orders.length === 0 && <EmptyState>You haven't placed any orders yet.</EmptyState>}
        {orders.map((o) => (
          <div key={o.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-stone-500">Order #{o.id.slice(0, 8)} · {formatDate(o.createdAt)}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {o.items.map((i) => (
                <li key={i.bookId} className="flex justify-between py-1.5">
                  <span>{i.title} × {i.quantity}</span>
                  <span>{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold">Total {formatPrice(o.total)}</span>
              {o.status === 'pending' && (
                <button className="btn-secondary" onClick={() => cancel(o.id)}>Cancel order</button>
              )}
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Ship to: {o.shippingAddress.fullName}, {o.shippingAddress.address}, {o.shippingAddress.city}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
