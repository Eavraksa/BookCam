import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navLink = ({ isActive }) =>
  `text-sm font-medium ${isActive ? 'text-amber-700' : 'text-stone-600 hover:text-stone-900'}`;

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-amber-700">
            📚 BookCam
          </Link>
          <NavLink to="/" end className={navLink}>
            Books
          </NavLink>
          {user && (
            <NavLink to="/orders" className={navLink}>
              My orders
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLink}>
              Admin
            </NavLink>
          )}

          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                <NavLink to="/cart" className={navLink}>
                  Cart{count > 0 && <span className="ml-1 rounded-full bg-amber-600 px-2 py-0.5 text-xs text-white">{count}</span>}
                </NavLink>
                <span className="hidden text-sm text-stone-500 sm:inline">
                  {user.displayName || user.email}
                  {isAdmin && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-800">admin</span>}
                </span>
                <button onClick={handleLogout} className="btn-secondary">
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLink}>
                  Log in
                </NavLink>
                <Link to="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white py-4 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} BookCam
      </footer>
    </div>
  );
}
