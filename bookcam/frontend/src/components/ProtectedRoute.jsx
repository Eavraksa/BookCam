import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Ui';

// Client-side gate for UX only. Real enforcement is in the Express API and Firebase rules.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
