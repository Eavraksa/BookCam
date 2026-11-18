import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, BookCover, Spinner } from '../../components/Ui';
import { booksApi, categoriesApi } from '../../services/api';
import { uploadCover, validateCover } from '../../services/storage';

const empty = { title: '', author: '', isbn: '', description: '', price: '', stock: '', categoryId: '', coverUrl: '', coverPath: '' };

export default function BookForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([categoriesApi.list(), editing ? booksApi.get(id) : null])
      .then(([cats, book]) => {
        setCategories(cats);
        if (book) setForm({ ...empty, ...book, price: String(book.price), stock: String(book.stock) });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onFile = (e) => {
    const picked = e.target.files[0];
    if (!picked) return;
    const problem = validateCover(picked);
    if (problem) {
      setError(problem);
      e.target.value = '';
      return;
    }
    setError('');
    setFile(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    let uploaded = null;
    try {
      const payload = { ...form };
      if (file) {
        uploaded = await uploadCover(file); // Firebase Storage (admin-only by rules)
        payload.coverUrl = uploaded.coverUrl;
        payload.coverPath = uploaded.coverPath;
      }
      if (editing) await booksApi.update(id, payload);
      else await booksApi.create(payload);
      navigate('/admin/books');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="card mx-auto max-w-2xl p-6">
      <h2 className="text-xl font-semibold">{editing ? 'Edit book' : 'Add book'}</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Title</label><input required maxLength={200} className="input" value={form.title} onChange={set('title')} /></div>
          <div><label className="label">Author</label><input required maxLength={150} className="input" value={form.author} onChange={set('author')} /></div>
          <div><label className="label">ISBN</label><input maxLength={20} className="input" value={form.isbn} onChange={set('isbn')} /></div>
          <div>
            <label className="label">Category</label>
            <select required className="input" value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categories.length === 0 && <p className="mt-1 text-xs text-red-600">Create a category first.</p>}
          </div>
          <div><label className="label">Price (USD)</label><input required type="number" min="0" step="0.01" className="input" value={form.price} onChange={set('price')} /></div>
          <div><label className="label">Stock</label><input required type="number" min="0" step="1" className="input" value={form.stock} onChange={set('stock')} /></div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={5} maxLength={5000} className="input" value={form.description} onChange={set('description')} />
        </div>
        <div>
          <label className="label">Cover image (JPG, PNG, WebP, GIF · max 5 MB)</label>
          <div className="flex items-center gap-4">
            <BookCover book={{ title: form.title, coverUrl: preview || form.coverUrl }} className="h-28 w-20 rounded" />
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} className="text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Link to="/admin/books" className="btn-secondary">Cancel</Link>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save book'}</button>
        </div>
      </form>
    </div>
  );
}
