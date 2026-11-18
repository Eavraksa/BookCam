import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { BookCover } from './Ui';

export default function BookCard({ book, categoryName }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const soldOut = book.stock <= 0;

  const handleAdd = () => {
    if (!user) return navigate('/login', { state: { from: '/' } });
    return addItem(book.id, 1);
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <Link to={`/books/${book.id}`}>
        <BookCover book={book} className="h-56 w-full" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {categoryName && <span className="text-xs uppercase tracking-wide text-amber-700">{categoryName}</span>}
        <Link to={`/books/${book.id}`} className="mt-1 font-semibold leading-snug hover:text-amber-700">
          {book.title}
        </Link>
        <p className="text-sm text-stone-500">{book.author}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-semibold">{formatPrice(book.price)}</span>
          <button className="btn-primary" disabled={soldOut} onClick={handleAdd}>
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
