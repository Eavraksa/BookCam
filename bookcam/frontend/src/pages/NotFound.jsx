import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-stone-600">That page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Back to books</Link>
    </div>
  );
}
