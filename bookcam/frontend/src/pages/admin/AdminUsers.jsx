import { useCallback, useEffect, useState } from 'react';
import { Alert, Spinner } from '../../components/Ui';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const changeRole = async (u, role) => {
    setError('');
    setNotice('');
    try {
      await usersApi.setRole(u.id, role);
      setNotice(`${u.email} is now ${role === 'admin' ? 'an admin' : 'a customer'}. They must sign in again for it to apply.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Permanently delete ${u.email}?`)) return;
    setError('');
    try {
      await usersApi.remove(u.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-lg font-semibold">Users ({users.length})</h2>
      <div className="mt-4 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{notice}</Alert>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Joined</th><th className="p-3">Role</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => {
              const self = u.id === me.uid;
              return (
                <tr key={u.id}>
                  <td className="p-3">{u.displayName || '—'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{formatDate(u.createdAt)}</td>
                  <td className="p-3">
                    <select className="input w-32" value={u.role || 'customer'} disabled={self} onChange={(e) => changeRole(u, e.target.value)}>
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    {!self && <button className="text-red-600 hover:underline" onClick={() => remove(u)}>Delete</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
