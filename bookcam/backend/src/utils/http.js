class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Lets async route handlers throw errors that reach the Express error handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Converts Firestore Timestamps (recursively) into ISO strings for JSON responses.
function serialize(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  }
  return value;
}

const docToJson = (doc) => ({ id: doc.id, ...serialize(doc.data()) });

module.exports = { HttpError, asyncHandler, serialize, docToJson };
