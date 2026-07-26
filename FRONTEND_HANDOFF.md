# VMS Frontend - Client Portal Documentation

**This is the Client Portal (Customer-facing) documentation.**

**For Master Console (Admin) documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)**

This document is the single source of truth for **Client Portal** frontend development and maintenance.

---

## 1. Project Purpose

This is a **Customer Portal** for individual sellers/clients in a multi-tenant VMS system. It supports:

- Packing staff scanning barcodes and recording video proof
- Upload of videos to storage configured by admin (via Master Console)
- Simple dashboard showing upload activity and status
- JWT-based authentication with role-based access control
- **NO configuration UI** — all platform/storage setup is done by admins in Master Console

The client portal focuses on core packing workflows:

1. Login / authentication
2. Packing staff barcode lookup and video recording/upload
3. Simple dashboard showing own videos and status
4. That's it — no admin config screens

---

## 1.5 Multi-Tenant Architecture Context

This portal is one half of a two-application system:

```
Master Console (Admins)             Client Portal (Customers)
  - Manage all clients              - Packing staff upload
  - Configure platforms             - View own dashboard
  - Configure storage               - No config UI
  - Activate/deactivate clients
```

Each client runs the same Client Portal code but:
- Logs in with their own seller account
- Sees only their own data (seller_id filtering)
- Uses storage/platforms configured by admin
- Cannot see other clients' videos or data

---

## 2. Frontend Stack (Client Portal)

Use a modern React-based frontend stack:

- **React 18** + Vite (fast dev server)
- JavaScript (TypeScript optional)
- **React Router** for navigation
- **Axios** for API calls
- **Recharts** for charts/visualizations
- **Tailwind CSS** or plain CSS for styling
- **Lucide React** for icons
- **Framer Motion** for animations (optional)

Backend base URL: `http://localhost:8080`

**Note:** Master Console uses the same stack but is a completely separate application in `vms-master-console/` directory.

---

## 3. Authentication and Authorization

### 3.1 Auth endpoints

Base path: /api/auth

| Method | Path | Purpose | Access |
|---|---|---|---|
| POST | /api/auth/login | Login with email/password | Public |
| POST | /api/auth/register | Register a new user | Public |

### 3.2 Request/response details

#### Login
Request body:

```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "token": "jwt_token_here",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

#### Register
Request body:

```json
{
  "email": "staff@example.com",
  "password": "secret",
  "fullName": "Packing Staff",
  "role": "PACKING_STAFF",
  "sellerId": 1
}
```

Response:

```json
{
  "token": "jwt_token_here",
  "email": "staff@example.com",
  "role": "PACKING_STAFF"
}
```

### 3.3 Roles

Supported roles:

- ADMIN
- SELLER_OWNER
- PACKING_STAFF
- VIEWER

### 3.4 Auth rules

- Login and register are public.
- All other endpoints require a valid JWT.
- JWT should be sent in the Authorization header as:

```http
Authorization: Bearer <token>
```

- Security config allows CORS from:
  - http://localhost:3000
  - http://localhost:5173

---

## 4. Backend Domain Model

The frontend should understand the following entities.

### 4.1 Seller
Fields:
- id
- businessName
- contactEmail
- contactPhone
- active
- createdAt

### 4.2 User
Fields:
- id
- email
- fullName
- role
- seller (relationship)
- active

### 4.3 EcomPlatform
Fields:
- id
- code
- displayName
- active

Important note:
- This entity is configurable from the UI.
- The code is automatically normalized to uppercase and spaces become underscores on create.

### 4.4 Order
Fields:
- id
- seller
- orderBarcode
- orderNumber
- awbNumber
- platform
- customerName
- productName
- createdAt

Important note:
- The order barcode is unique and is the lookup key used on the packing station.

### 4.5 PackingVideo
Fields:
- id

---

## SMTP (OTP Email) — Master Console

- The Master Console backend sends OTP emails using `spring.mail` config in `vms-master-console-backend/src/main/resources/application.yml`.
- For Gmail, create an App Password (Google Account > Security > App passwords) and set it as the environment variable `MAIL_PASSWORD` before starting the backend.

Quick commands:

```powershell
# one-time (persistent) set for current user; reopen terminal to take effect
setx MAIL_PASSWORD "<your-app-password>"

# or for the current session only
$env:MAIL_PASSWORD = "<your-app-password>"

# then start the backend
mvn -DskipTests spring-boot:run
```

If SMTP fails, the backend will log the OTP to the server console (development fallback) so you can continue testing.
- order
- packedByStaff
- localTempPath
- finalStoragePath
- storageProvider
- uploadStatus
- durationSeconds
- fileSizeBytes
- recordedAt

### 4.6 StorageConfig
Fields:
- id
- seller
- platform
- providerType
- credentialsJson
- videoNamingSource
- active

Important note:
- This is the main “no-code configuration” table.
- It controls what storage backend is used and how video filenames are derived.

---

## 5. Core User Flows

### 5.1 Login flow

- User enters email/password.
- Frontend calls POST /api/auth/login.
- On success, store JWT in memory or secure storage.
- Redirect user based on role.

### 5.2 Registration flow

- Admin or seller owner creates a user.
- Frontend submits registration form.
- Backend creates user and returns JWT.

### 5.3 Packing flow

This is the main business flow.

1. Staff scans or enters barcode.
2. Frontend calls GET /api/packing-videos/lookup-order/{barcode}.
3. If the order exists, the UI shows order details.
4. Staff chooses a platform from the dropdown, if relevant.
5. Staff records video from webcam/media recorder.
6. Frontend uploads the video to POST /api/packing-videos/{orderBarcode}/upload.
7. Backend saves the video as pending, then the upload worker processes it in the background.

### 5.4 Admin configuration flow

- Admin manages e-commerce platforms through the platform list screen.
- Admin configures storage backend per seller/platform through storage config screens.
- These changes impact future uploads without requiring backend deployment changes.

### 5.5 Dashboard flow

- Dashboard reads aggregate counts from backend endpoints.
- Charts should be populated from the count response bodies.

---

## 6. API Reference for Frontend

All endpoints are under the base URL http://localhost:8080.

### 6.1 Authentication

#### POST /api/auth/login
- Public
- Body: { email, password }
- Returns: token, email, role
- Frontend usage: login screen

#### POST /api/auth/register
- Public
- Body: { email, password, fullName, role, sellerId }
- Returns: token, email, role
- Frontend usage: user onboarding screen

### 6.2 Seller profile management

#### GET /api/sellers/me
- Auth required
- Available to: SELLER_OWNER, VIEWER
- Returns: SellerProfileResponse with seller details
- Frontend usage: seller profile screen

Example response:

```json
{
  "id": 1,
  "businessName": "Acme Trading Co.",
  "contactEmail": "admin@acmetrading.com",
  "contactPhone": "+91 9876543210",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /api/sellers/me
- Auth required
- SELLER_OWNER only
- Body: { businessName, contactPhone }
- Returns: updated SellerProfileResponse
- Frontend usage: update seller profile from settings screen

Example request:

```json
{
  "businessName": "Updated Business Name",
  "contactPhone": "+91 9876543211"
}
```

**Note on multi-tenant future:** These `/sellers/me` endpoints provide seller-scoped access. When migrating to a multi-tenant master console, these endpoints will be the primary way sellers interact with their own data.

### 6.3 E-commerce platforms

#### GET /api/ecom-platforms
- Auth required
- Returns: array of active EcomPlatform objects
- Frontend usage: platform dropdown on packing screen and admin screens

Example response:

```json
[
  {
    "id": 1,
    "code": "FLIPKART",
    "displayName": "Flipkart",
    "active": true
  }
]
```

#### POST /api/ecom-platforms
- Auth required
- Admin only
- Body example:

```json
{
  "code": "jiomart",
  "displayName": "JioMart"
}
```

- Backend will uppercase the code and replace spaces with underscores.
- Example resulting code: JIOMART

#### PUT /api/ecom-platforms/{id}/deactivate
- Auth required
- Admin only
- Frontend usage: soft-delete / disable platform

### 6.3 Packing videos

#### GET /api/packing-videos/lookup-order/{barcode}
- Auth required
- Path parameter: barcode
- Returns: Order object
- Frontend usage: packing screen to validate scan before recording

Example response:

```json
{
  "id": 10,
  "orderBarcode": "ORD12345",
  "orderNumber": "1001",
  "awbNumber": "1234567890",
  "platform": {
    "id": 1,
    "code": "FLIPKART",
    "displayName": "Flipkart",
    "active": true
  },
  "customerName": "Ravi",
  "productName": "Bottle"
}
```

#### POST /api/packing-videos/{orderBarcode}/upload
- Auth required
- Multipart form-data
- Required field: file
- Optional fields: durationSeconds, platformId
- Frontend usage: upload recorded video after recording completes

Form data example:

```text
file: <video file>
durationSeconds: 45
platformId: 1
```

Response:

```json
{
  "id": 55,
  "uploadStatus": "PENDING",
  "localTempPath": "/var/vms/incoming/ORD12345_1710000000000.webm"
}
```

### 6.4 Storage configs

#### GET /api/storage-configs/seller/{sellerId}
- Auth required
- Admin only by security config
- Returns: list of storage configs for the seller

#### POST /api/storage-configs
- Auth required
- Admin only by security config
- Body: StorageConfig object
- Frontend usage: create/update storage destination configuration

#### DELETE /api/storage-configs/{id}
- Auth required
- Admin only by security config
- Frontend usage: remove storage config row

### 6.5 Dashboard

#### GET /api/dashboard/videos-by-platform
- Auth required
- Returns a map of platform display name to video count

Example response:

```json
{
  "Flipkart": 10,
  "Amazon": 3
}
```

#### GET /api/dashboard/upload-status
- Auth required
- Returns a map of upload status to count

Example response:

```json
{
  "PENDING": 2,
  "UPLOADING": 1,
  "DONE": 15,
  "FAILED": 1
}
```

---

## 7. Business Rules and Constraints

The frontend must respect the following backend rules.

### 7.1 Upload behavior

- The upload is not instant.
- The first backend step saves the video locally in /var/vms/incoming.
- A background worker then moves it to the configured storage provider.
- The initial API response returns a PackingVideo record with uploadStatus = PENDING.

### 7.2 Storage provider resolution

The backend resolves storage configuration using this priority:

1. exact seller + specific platform match
2. seller default config with platform = null
3. otherwise fail with an error

This means the frontend should allow the admin to configure storage per seller/platform and should display a clear error if no active config exists.

### 7.3 Video naming rules

Video names are generated from:

- orderNumber by default
- awbNumber if configured
- fallback to the scanned orderBarcode if preferred field is empty

The backend sanitizes invalid characters to underscores.

### 7.4 Platform normalization

When creating a platform:
- code is converted to uppercase
- spaces become underscores

Example input:
- "Jio Mart"

Result:
- "JIOMART"

### 7.5 File constraints

- Maximum upload size is 200MB
- Frontend should support large file uploads and show progress when possible

### 7.6 Security constraints

- JWT expiration is 24 hours by default
- The backend uses stateless authentication
- The frontend should refresh the session or redirect to login when the token expires

### 7.7 Data constraints

- Order barcode is unique
- Platform code must be unique
- Storage config is tied to seller and optional platform

---

## 8. Suggested Frontend Screens

The frontend should include these screens/pages.

### 8.1 Login page
- email/password form
- call login API
- store JWT
- navigate based on role

### 8.2 Register page
- create new user
- role selection
- seller selection if applicable

### 8.3 Packing station page
- barcode input
- lookup order endpoint
- show order details
- optional platform dropdown
- webcam/video recording UI
- upload video using multipart/form-data
- show upload status

### 8.4 Admin: E-commerce platforms page
- list active platforms
- add new platform
- deactivate platform

### 8.5 Admin: Storage config page
- list storage configs by seller
- create new config
- choose provider type
- choose video naming source
- save credentials JSON

### 8.6 Seller profile page
- display seller business details (read-only: ID, email, account status, member since)
- edit business name and contact phone (SELLER_OWNER only, read-only for VIEWER)
- show account status (active/inactive)
- show account creation date
- update confirmation/error feedback

### 8.7 Dashboard page
- show charts/cards for:
  - videos by platform
  - upload status breakdown

---

## 9. Frontend Implementation Notes

### 9.1 API client pattern

Use a shared API client with:

- base URL: http://localhost:8080
- Authorization header injection
- centralized error handling

### 9.2 File upload handling

For video upload:
- use FormData
- send the file under field name file
- include durationSeconds and platformId if available

### 9.3 State handling

The frontend should clearly represent these upload states:

- idle
- recording
- uploading
- pending
- uploading
- done
- failed

### 9.4 Role-based routing

- ADMIN: access admin/management screens and dashboard (includes seller profile for reference)
- PACKING_STAFF: access packing station and basic order lookup
- SELLER_OWNER: access seller-related config, dashboard, and seller profile management
- VIEWER: read-only access to dashboard and seller profile

---

## 10. Multi-Tenant Architecture (Future Roadmap)

This system is designed to evolve into a multi-tenant platform with a master console. Here are the architectural patterns already in place:

### 10.1 Current state (single seller per instance)

- One customer = one seller account
- Portal for the seller's own team to upload videos
- Basic role separation (SELLER_OWNER, VIEWER, PACKING_STAFF, ADMIN)

### 10.2 Multi-tenant evolution strategy

1. **Phase 1** (current): Add seller profile management ✓
   - Sellers can manage their own business details
   - Authentication tied to seller via user.seller relationship
   - All queries implicitly filtered by seller_id

2. **Phase 2** (next): Master console architecture
   - Super-admin manages multiple sellers
   - Each seller gets an isolated database or schema
   - API routes filtered by authenticated seller_id
   - `/sellers/me` endpoints become primary seller access points

3. **Phase 3**: Tenant context middleware
   - JWT includes seller_id claim
   - All queries automatically filtered by this claim
   - Prevents accidental cross-seller data leaks

### 10.3 Key patterns for multi-tenant transition

- **Use `/sellers/me` for all seller-scoped operations** — these stay stable across architectures
- **Admin `/sellers/{id}` routes** — these become master-console only
- **Query filters by seller_id** — already done for orders, platforms, storage configs
- **JWT and UserPrincipal** — already include seller context
- **Role enforcement** — already implemented per-endpoint

When you migrate to multi-tenant, you'll mostly rename and reorganize these endpoints; the underlying logic is already seller-aware.

---

## 11. Important Notes for Future Maintenance

Whenever the backend changes, update this file with:

1. new or changed endpoints
2. new request/response fields
3. new validation or business rules
4. new roles or permission changes
5. new storage logic or naming behavior
6. new UI-sensitive constraints

### Maintenance checklist

Before handing this to a new frontend agent, verify:
- API paths are still correct
- request and response shapes are still correct
- auth rules and role restrictions are still correct
- upload behavior and storage logic are still correct
- any new entities or endpoints are documented
- multi-tenant patterns are maintained if architecture has evolved

---

## 12. Copy/Paste Prompt for Claude

Use the following prompt with Claude or another coding agent:

"Build a modern frontend for this backend system. Use the specifications in this document as the source of truth. Implement login, registration, packing station video recording/upload, admin e-commerce platform management, storage config management, seller profile management, and dashboard views. Follow the backend API paths exactly, use JWT auth, support role-based access, and respect the business rules, validation constraints, and upload behavior described here. Keep the implementation clean, reusable, and easy to maintain. If any backend behavior changes later, update this document first before making frontend changes. Pay special attention to the `/sellers/me` endpoints as these are the foundation for future multi-tenant scaling."

