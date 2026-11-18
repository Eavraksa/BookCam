import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../utils/format';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        New to BookCam? <Link to="/register" className="text-amber-700 underline">Create an account</Link>
      </p>
    </div>
  );
}
