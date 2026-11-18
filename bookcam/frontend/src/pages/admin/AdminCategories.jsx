import { useCallback, useEffect, useState } from 'react';
import { Alert, EmptyState, Spinner } from '../../components/Ui';
import { categoriesApi } from '../../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const reset = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await categoriesApi.update(editingId, form);
      else await categoriesApi.create(form);
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setError('');
    try {
      await categoriesApi.remove(c.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="card h-fit space-y-3 p-5">
        <h2 className="text-lg font-semibold">{editingId ? 'Edit category' : 'Add category'}</h2>
        <input required maxLength={60} className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea maxLength={300} rows={3} className="input" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div>
        <Alert>{error}</Alert>
        {categories.length === 0 ? (
          <EmptyState>No categories yet.</EmptyState>
        ) : (
          <ul className="card mt-0 divide-y divide-stone-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="text-sm text-stone-500">{c.description}</p>}
                </div>
                <div className="space-x-3 text-sm">
                  <button className="text-amber-700 hover:underline" onClick={() => { setEditingId(c.id); setForm({ name: c.name, description: c.description || '' }); }}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(c)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
