import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../utils/format';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="card mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required maxLength={100} className="input" value={form.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required className="input" value={form.password} onChange={set('password')} autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" required className="input" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        Already registered? <Link to="/login" className="text-amber-700 underline">Log in</Link>
      </p>
    </div>
  );
}
