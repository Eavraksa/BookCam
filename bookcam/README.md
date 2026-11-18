# BookCam – Online Bookstore

A full-stack bookstore with customer and admin roles.

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | React 18, JavaScript, Tailwind CSS, React Router (Vite) |
| Backend        | Node.js, Express.js, Firebase Admin SDK                 |
| Database       | Firebase Cloud Firestore                                |
| Authentication | Firebase Authentication (email/password) + role claims  |
| Image storage  | Firebase Cloud Storage                                  |

## Quick start (pre-configured for project `bookcam-2ca98`)

This ZIP already contains `frontend/.env`, `backend/.env` (without the private key) and `.firebaserc` for the Firebase project `bookcam-2ca98`. You still need to do these steps in the Firebase console and terminal:

1. **Console:** enable **Authentication -> Email/Password**, create **Firestore Database**, and set up **Storage** (Storage may require the Blaze plan; see below).
2. **Service account:** Project settings -> Service accounts -> **Generate new private key**. Open `backend/.env` and replace `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` with the values from the downloaded JSON. Keep the quotes and the `\n` sequences in the key.
3. **Deploy rules** (from this folder): `firebase login`, then `firebase deploy --only firestore:rules,firestore:indexes,storage`.
4. **Run:** `cd backend && npm install && npm run dev`, and in a second terminal `cd frontend && npm install && npm run dev`. Open http://localhost:5173.
5. Sign up, then `cd backend && npm run make-admin -- you@example.com`, log out and log in again.

**Security:** `backend/.env` will contain your private key once filled in. Never share it, commit it to GitHub, or send the ZIP to anyone after adding it.

**Without Storage:** leave `FIREBASE_STORAGE_BUCKET` empty in `backend/.env` and do not choose a cover file in the admin book form. Books then show "No cover".

## Project structure

```
bookcam/
├── firebase.json                 # Firebase CLI config (points to the rules below)
├── firebase/
│   ├── firestore.rules           # Firestore Security Rules
│   ├── storage.rules             # Cloud Storage Security Rules
│   └── firestore.indexes.json    # Composite index (books by category)
├── backend/                      # Express API
│   ├── .env.example
│   ├── scripts/makeAdmin.js      # promote the first admin
│   ├── scripts/seed.js           # optional sample data
│   └── src/ (index, firebase, middleware/auth, routes/*, utils/*)
└── frontend/                     # React app
    ├── .env.example
    └── src/ (App, firebase, context/*, services/*, components/*, pages/*, pages/admin/*)
```

## How it works

**Roles.** A user's role (`admin` or `customer`) is stored as a Firebase Auth *custom claim*. Only the Admin SDK on the backend can set it, so clients can't forge it. The same claim is checked by the Express middleware, the Firestore rules and the Storage rules. New sign-ups are always `customer`.

**Who writes what.**

| Collection   | Browser (Firestore SDK)                  | Express API                                                     |
| ------------ | ---------------------------------------- | --------------------------------------------------------------- |
| `users`      | create/read/update own profile (no role) | list users, change roles, delete users (admin)                  |
| `books`      | read                                     | create / update / delete (admin)                                |
| `categories` | read                                     | create / update / delete (admin)                                |
| `carts`      | read/write own cart (`carts/{uid}`)      | cleared when an order is placed                                 |
| `orders`     | read own                                 | create (any user), cancel own pending, status/delete (admin)    |

Orders are created by the backend inside a Firestore transaction: prices come from the database (never from the client), stock is checked and decremented, and the cart is cleared. Cancelling an order restores stock.

**Book covers.** The admin form uploads the image directly to Cloud Storage (`book-covers/…`, admin-only, images under 5 MB by the Storage rules). The download URL and storage path are then saved with the book through the API; replacing or deleting a book removes the old image.

## Setup

### 1. Prerequisites
- Node.js 18.11 or newer
- A Google account and a Firebase project

### 2. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Sign-in method →** enable **Email/Password**.
3. **Build → Firestore Database → Create database** (production mode; choose a region).
4. **Build → Storage → Get started** (production mode). Note: Storage may require the project to be on the Blaze (pay-as-you-go) plan; it has a free usage tier.
5. **Project settings (gear) → General → Your apps → Web (`</>`)** → register an app and copy the config values.
6. **Project settings → Service accounts → Generate new private key** → download the JSON file (keep it secret).

### 3. Configure environment variables

**Frontend** – copy `frontend/.env.example` to `frontend/.env` and fill in the web config from step 2.5:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:5000/api
```

**Backend** – copy `backend/.env.example` to `backend/.env` and fill in values from the service-account JSON (step 2.6):

```
PORT=5000
CORS_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="<private_key>"        # keep the quotes and the \n sequences
FIREBASE_STORAGE_BUCKET=<your Storage bucket name>
```

Never commit `.env` files or the service-account JSON (the included `.gitignore` already excludes them).

### 4. Deploy the security rules and index

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # choose your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

(Alternatively paste `firebase/firestore.rules` and `firebase/storage.rules` into the Rules tabs in the Firebase Console and click **Publish**. If you skip the index, the first filtered-by-category query to the API will log a link in the backend console to create it.)

### 5. Install and run

```bash
# Terminal 1 – backend
cd backend
npm install
npm run dev          # http://localhost:5000  (check /api/health)

# Terminal 2 – frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### 6. Create your first admin
1. Open the app and **Sign up** with the email you want as admin.
2. Promote it:
   ```bash
   cd backend
   npm run make-admin -- you@example.com
   ```
3. **Log out and log in again** so the new role takes effect. An **Admin** link appears in the navigation bar.
4. Optional sample data: `npm run seed` (in `backend`). Otherwise create categories and books in the admin area.

After that, admins can promote or demote other users from **Admin → Users**.

## API reference

All routes are under `/api`. "Auth" = `Authorization: Bearer <Firebase ID token>`.

| Method & path                   | Access          | Purpose                                      |
| ------------------------------- | --------------- | -------------------------------------------- |
| `GET /health`                   | public          | Health check                                 |
| `GET /books`, `GET /books/:id`  | public          | List (supports `?category=&q=`) / read       |
| `POST /books`                   | admin           | Create book                                  |
| `PUT /books/:id`                | admin           | Update book (replaces cover in Storage)      |
| `DELETE /books/:id`             | admin           | Delete book and its cover                    |
| `GET /categories[/:id]`         | public          | Read categories                              |
| `POST/PUT/DELETE /categories`   | admin           | Manage categories (delete blocked if in use) |
| `POST /orders`                  | signed in       | Place order from `{items, shippingAddress}`  |
| `GET /orders`                   | signed in       | My orders                                    |
| `GET /orders/:id`               | owner or admin  | One order                                    |
| `POST /orders/:id/cancel`       | owner           | Cancel own pending order                     |
| `GET /orders/admin/all`         | admin           | All orders (`?status=`)                      |
| `PATCH /orders/:id/status`      | admin           | Change status                                |
| `DELETE /orders/:id`            | admin           | Delete delivered/cancelled order             |
| `GET/PATCH /users/me`           | signed in       | My profile                                   |
| `GET /users`                    | admin           | List users                                   |
| `PATCH /users/:uid/role`        | admin           | Set `admin` / `customer`                     |
| `DELETE /users/:uid`            | admin           | Delete user                                  |

## Production build

```bash
cd frontend && npm run build       # outputs frontend/dist (host on Firebase Hosting, Netlify, etc.)
cd backend  && npm start           # run behind HTTPS on a Node host (Cloud Run, Render, etc.)
```

Set `VITE_API_URL` to the deployed API URL before building, and set the backend's `CORS_ORIGIN` to the deployed frontend origin.

## Security notes
- Admin operations require a verified ID token **and** the `admin` claim (checked on every request; revoked tokens are rejected).
- Firestore rules block all client writes to `books`, `categories` and `orders`, and stop users granting themselves a role.
- Order totals and stock changes are computed on the server in a transaction.
- Inputs are validated on the server; Express uses `helmet`, restricted CORS and a small JSON body limit.
- The React route guards are only for user experience; the real enforcement is server-side and in the rules.
- Consider adding rate limiting (e.g. `express-rate-limit`) and Firebase App Check before going to production.

## Troubleshooting
- **"Missing or insufficient permissions"** – deploy the rules (step 4).
- **Admin link doesn't appear after `make-admin`** – log out and back in so a fresh token carries the claim.
- **Backend exits with "Missing Firebase Admin credentials"** – check `backend/.env`; the private key must keep its `\n` sequences inside double quotes.
- **Cover upload fails** – confirm Storage is enabled, `VITE_FIREBASE_STORAGE_BUCKET` matches your bucket, the storage rules are deployed, and you are logged in as an admin.
- **CORS error** – make `CORS_ORIGIN` exactly match the URL in your browser address bar.
