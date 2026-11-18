import { NavLink, Outlet } from 'react-router-dom';

const tab = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-stone-200'}`;

export default function AdminLayout() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="mt-4 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        <NavLink to="/admin/books" className={tab}>Books</NavLink>
        <NavLink to="/admin/categories" className={tab}>Categories</NavLink>
        <NavLink to="/admin/orders" className={tab}>Orders</NavLink>
        <NavLink to="/admin/users" className={tab}>Users</NavLink>
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
