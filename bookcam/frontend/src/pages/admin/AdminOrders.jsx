import { useCallback, useEffect, useState } from 'react';
import { Alert, EmptyState, Spinner, StatusBadge } from '../../components/Ui';
import { ordersApi } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    ordersApi
      .all()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const changeStatus = async (id, status) => {
    setError('');
    try {
      await ordersApi.setStatus(id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this order record?')) return;
    setError('');
    try {
      await ordersApi.remove(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;
  const shown = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Orders ({shown.length})</h2>
        <select className="input w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        {shown.length === 0 && <EmptyState>No orders.</EmptyState>}
        {shown.map((o) => (
          <div key={o.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-stone-500">#{o.id.slice(0, 8)} · {formatDate(o.createdAt)} · {o.userEmail}</p>
              <StatusBadge status={o.status} />
            </div>
            <ul className="mt-2 text-sm">
              {o.items.map((i) => <li key={i.bookId}>{i.title} × {i.quantity} — {formatPrice(i.price * i.quantity)}</li>)}
            </ul>
            <p className="mt-2 text-xs text-stone-500">
              {o.shippingAddress.fullName} · {o.shippingAddress.phone} · {o.shippingAddress.address}, {o.shippingAddress.city} {o.shippingAddress.postalCode}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold">{formatPrice(o.total)}</span>
              <div className="flex items-center gap-3">
                <select
                  className="input w-40"
                  value={o.status}
                  disabled={o.status === 'cancelled'}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  aria-label="Order status"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {['delivered', 'cancelled'].includes(o.status) && (
                  <button className="text-sm text-red-600 hover:underline" onClick={() => remove(o.id)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
