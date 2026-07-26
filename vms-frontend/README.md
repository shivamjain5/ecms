# VMS Frontend (React + Vite)

Corporate console for the Video Management System backend: packing-proof recording,
CCTV-ready dashboard, and no-code storage/marketplace configuration.

## Pages

- **Login** (`/login`) — JWT auth against `POST /api/auth/login`; redirects to each role's default page
- **Register** (`/register`) — `POST /api/auth/register`; public, role + Seller ID selection
- **Dashboard** (`/dashboard`) — videos-by-marketplace and upload-status charts
- **Scan & Pack** (`/scan`) — barcode lookup → marketplace selection → webcam recording → upload
- **Configuration** (`/configuration`) — manage marketplaces (`EcomPlatform`) and storage
  destinations / video-naming rules (`StorageConfig`); write actions require `ROLE_ADMIN`
  (matches the backend's `SecurityConfig`), other roles see it read-only.

## Role-based access

Matches the backend handoff doc exactly (`src/config/roleAccess.js`):

| Role | Can access |
|---|---|
| ADMIN | Dashboard, Scan & Pack, Configuration |
| SELLER_OWNER | Dashboard, Configuration |
| PACKING_STAFF | Scan & Pack only |
| VIEWER | Dashboard only |

The sidebar only shows links a role can use, and `RoleRoute` redirects away from any
URL a role isn't allowed to open. Update `roleAccess.js` first if backend role rules change.

Note: `/api/storage-configs/**` is restricted to `ROLE_ADMIN` entirely on the backend
(even reading the list), so a `SELLER_OWNER` reaching the Configuration page will see
the Marketplaces tab but a clear "Admins only" message on the Storage tab rather than
a silent failure.

## Setup

1. Make sure the Spring Boot backend is running (default `http://localhost:8080`)
2. Install dependencies:
   ```
   npm install
   ```
3. (Optional) copy `.env.example` to `.env` if your backend runs somewhere else:
   ```
   cp .env.example .env
   ```
4. Run the dev server:
   ```
   npm run dev
   ```
5. Open `http://localhost:5173`

## First login

You need at least one user in the database. If you haven't created one yet, register
via curl/Postman first (the UI intentionally doesn't expose open self-signup):

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123","fullName":"Admin","role":"ADMIN"}'
```

Then sign in with that email/password on the login screen.

## Design notes

- Palette and type live as CSS variables in `src/index.css` — change them there to re-theme
  the whole app.
- The barcode-scanline motif (the animated amber sweep) appears only on the login hero and
  the "uploading" state on the Scan & Pack page — intentionally kept to those two spots.
- Charts use `recharts`; icons use `lucide-react`; page transitions use `framer-motion`.

## Notes on the webcam recording flow

- Requires the browser to have camera permission for this site (Chrome/Edge will prompt).
- Uses `MediaRecorder` with `video/webm;codecs=vp8` — supported in all modern desktop browsers.
- If you need this running on a shared packing-station PC over `http://` (not `https://`) on
  a network IP rather than `localhost`, most browsers will block camera access — you'll need
  either `localhost`, or to set up HTTPS (even a self-signed cert) for that machine.
