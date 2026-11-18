const { HttpError } = require('./http');

const bad = (msg) => new HttpError(400, msg);

function reqString(value, field, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') throw bad(`${field} is required`);
  const v = value.trim();
  if (v.length < min || v.length > max) {
    throw bad(`${field} must be between ${min} and ${max} characters`);
  }
  return v;
}

function optString(value, field, { max = 2000 } = {}) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw bad(`${field} must be a string`);
  const v = value.trim();
  if (v.length > max) throw bad(`${field} must be at most ${max} characters`);
  return v;
}

function number(value, field, { min = 0, max = 1e9, integer = false } = {}) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw bad(`${field} must be a number`);
  if (integer && !Number.isInteger(n)) throw bad(`${field} must be a whole number`);
  if (n < min || n > max) throw bad(`${field} must be between ${min} and ${max}`);
  return n;
}

// Firestore document IDs must not contain "/" etc. Reject anything unexpected early.
function docId(value, field = 'id') {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw bad(`Invalid ${field}`);
  }
  return value;
}

module.exports = { reqString, optString, number, docId };
