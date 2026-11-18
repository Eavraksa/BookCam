import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import BookDetail from './pages/BookDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminBooks from './pages/admin/AdminBooks.jsx';
import BookForm from './pages/admin/BookForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Signed-in customers (and admins) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="books" replace />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="books/new" element={<BookForm />} />
            <Route path="books/:id/edit" element={<BookForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
