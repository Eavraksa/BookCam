const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (n) => money.format(Number(n) || 0);

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '';

// Turns Firebase Auth error codes into readable messages.
export function authErrorMessage(err) {
  switch (err && err.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return (err && err.message) || 'Something went wrong. Please try again.';
  }
}
