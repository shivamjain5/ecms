# VMS Backend (Spring Boot)

Video Management System backend for e-commerce sellers: packing-proof videos per order
(for return/fraud claims) + warehouse CCTV monitoring, with pluggable storage
(Google Drive / AWS S3 / Local-NAS) switchable per seller **without any code change**.

**Java version:** 21 (LTS) — matches `pom.xml`. Spring Boot 3.3.x fully supports it, and
it's supported by Oracle/OpenJDK until ~2029, longer runway than Java 17.

## Authentication (Spring Security + JWT)

- `POST /api/auth/register` — creates a user (email, password, fullName, role, sellerId).
  Role must be one of `ADMIN`, `SELLER_OWNER`, `PACKING_STAFF`, `VIEWER`.
- `POST /api/auth/login` — body `{ "email": "...", "password": "..." }`, returns a JWT.
- Every other endpoint requires `Authorization: Bearer <token>`.
- `/api/storage-configs/**` is restricted to `ROLE_ADMIN` only (change in `SecurityConfig`
  if sellers should also manage their own storage config).
- Passwords are hashed with BCrypt (`PasswordEncoder` bean in `SecurityConfig`).
- **Before production**: move `jwt.secret` out of `application.yml` into an environment
  variable (`JWT_SECRET`), and lock down `/api/auth/register` behind an admin/invite flow
  instead of leaving open self-signup.

## E-commerce platform selection & configurable video naming

- **Platforms are a DB table, not a fixed enum** (`EcomPlatform`) — an admin can add a brand
  new marketplace anytime via `POST /api/ecom-platforms` (e.g. `{"code":"JIOMART","displayName":"JioMart"}`),
  no code change or redeploy needed. Seeded on first run with Flipkart/Amazon/Meesho/Myntra/
  JioMart/Own Website/Other (`DataSeeder`).
- `GET /api/ecom-platforms` feeds the "which website are you packing for?" dropdown the
  staff picks *before/while recording* on the packing screen.
- That selection is passed as `platformId` to `POST /api/packing-videos/{orderBarcode}/upload`
  — it both decides which storage folder the video lands in **and** gets stamped onto the
  order (so a mis-tagged/auto-created order gets corrected by whatever staff actually selects).
- **Videos are stored fully separated by platform**: folder structure is
  `{sellerId}/{platformCode}/{yyyy-MM-dd}/{videoName}.{ext}` — so Flipkart and Amazon
  videos never mix, even within the same storage backend.
- **Video filename is configurable, default = order number**: `StorageConfig.videoNamingSource`
  is `ORDER_NUMBER` by default, or set to `AWB_NUMBER` per seller (or per seller+platform) if
  that customer wants AWB-based naming instead — again, just a DB row edit via
  `POST /api/storage-configs`, no code change. Falls back to the raw scanned barcode if the
  preferred field is blank on that order.

## How barcode scanners fit in (important — no special driver needed)

Almost all USB/Bluetooth barcode scanners operate in **"HID keyboard emulation" mode**:
to the OS/browser, the scanner looks exactly like someone typing on a keyboard very fast,
followed by an Enter keystroke. This means:

- No SDK, no native driver, no special Java library needed on the backend.
- On the React frontend, just keep an `<input>` focused on the packing screen. When staff
  scans a barcode, the digits appear in that input automatically, followed by Enter.
- On Enter, the frontend calls `GET /api/packing-videos/lookup-order/{barcode}`.
- If found, start `MediaRecorder` (webcam) immediately.
- When staff scans the **shipping label barcode** (or clicks "Done Packing"), stop the
  recorder and POST the video blob to `/api/packing-videos/{orderBarcode}/upload`.

This is why the scanner "just works" with a plain text input — no backend barcode
decoding logic is required at all.

## Storage abstraction (the "no-code" switch)

```
StorageProvider (interface)
 ├── GoogleDriveStorageProvider
 ├── S3StorageProvider
 └── LocalStorageProvider
```

`StorageProviderFactory.resolve(sellerId, platform)` reads the seller's `StorageConfig`
row from the DB and returns the right implementation. To move a seller (or just their
Amazon videos) from Drive to S3, an admin edits one row via
`POST /api/storage-configs` — nothing to redeploy.

## Background upload

`UploadWorkerService` runs every 15s (`@Scheduled`), picks up `PENDING` videos, and
uploads them asynchronously (`@Async`) so packing staff are never blocked by
upload speed. Failed uploads are marked `FAILED` for retry/alerting.

## Running locally

1. `createdb vms_db` (PostgreSQL)
2. Update `src/main/resources/application.yml` with your DB credentials
3. Set `JWT_SECRET` env var to a long random string
4. `mvn spring-boot:run`
5. API available at `http://localhost:8080`
6. Register a first admin: `POST /api/auth/register` with `role: "ADMIN"`, then log in

## Still to build (next iteration)

- CCTV RTSP ingestion service (FFmpeg process per camera, segmenting to N-minute chunks)
- Retry/backoff + alerting for repeatedly FAILED uploads
- Method-level `@PreAuthorize` checks so a seller can only ever see their own orders/videos
- React frontend: packing screen (barcode input + webcam), CCTV live-view grid,
  dashboard with charts, storage-config settings screen, login screen

