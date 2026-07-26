# VMS Multi-Tenant Architecture Documentation

## System Overview

The VMS has been restructured as a **true multi-tenant system** with two completely separate applications:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MASTER CONSOLE                              │
│                    (Admin Portal)                                │
│  ────────────────────────────────────────────────────────────   │
│  • Manage Clients/Sellers                                       │
│  • Configure E-commerce Platforms (global)                      │
│  • Configure Storage Backends per Client                        │
│  • Activate/Deactivate Clients                                  │
│  • View Cross-Client Dashboards & Analytics                     │
│                                                                  │
│  Backend: http://localhost:8080/api/master-console/*            │
│  Frontend: http://localhost:5174 (runs on different port)       │
│                                                                  │
│  Users: Admin only (ROLE_ADMIN)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Database: shared)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT PORTAL(s)                              │
│              (Individual Seller App)                             │
│  ────────────────────────────────────────────────────────────   │
│  One instance per client/seller                                 │
│                                                                  │
│  • Scan & upload packing videos                                 │
│  • View dashboard (client's own data)                           │
│  • NO configuration UI (all done in Master Console)             │
│                                                                  │
│  Backend: Same (http://localhost:8080)                          │
│  Frontend: http://localhost:5173                                │
│                                                                  │
│  Users: SELLER_OWNER, VIEWER, PACKING_STAFF (tied to seller)   │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
vms-backend/
├── src/main/java/com/vms/
│   ├── controller/
│   │   ├── AuthController.java                    (both portals)
│   │   ├── DashboardController.java               (both portals)
│   │   ├── PackingVideoController.java            (both portals)
│   │   ├── EcomPlatformController.java            (client portal only)
│   │   ├── StorageConfigController.java           (client portal only - deprecated)
│   │   ├── SellerController.java                  (DEPRECATED - kept for backward compat)
│   │   ├── MasterConsoleSellerController.java     (master console only)
│   │   ├── MasterConsoleEcomPlatformController.java (master console only)
│   │   └── MasterConsoleStorageConfigController.java (master console only)
│   ├── entity/ ......................................... (shared)
│   ├── repository/ ..................................... (shared)
│   ├── service/ ........................................ (shared)
│   └── security/ ....................................... (shared)
│
├── vms-frontend/                                   (Client Portal)
│   ├── src/pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ScanningPage.jsx
│   │   └── (NO ConfigurationPage - removed)
│   ├── vite.config.js (port 5173)
│   └── package.json
│
└── vms-master-console/                            (Master Console)
    ├── src/pages/
    │   ├── LoginPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── ClientsPage.jsx
    │   ├── PlatformsPage.jsx
    │   └── StorageConfigPage.jsx
    ├── vite.config.js (port 5174)
    └── package.json
```

## Backend API Structure

### Client Portal Endpoints (vms-frontend connects here)

```
POST   /api/auth/login                  # Login (returns JWT)
POST   /api/auth/register               # Create user account
GET    /api/auth/me                     # Current user profile
GET    /api/packing-videos/lookup-order/{barcode}
POST   /api/packing-videos/{barcode}/upload
GET    /api/dashboard/by-platform
GET    /api/dashboard/by-status
GET    /api/ecom-platforms              # List active platforms (read-only)
```

**Note:** Storage configuration and platform management removed from client portal.

### Master Console Endpoints (vms-master-console connects here)

All endpoints require ROLE_ADMIN and are prefixed with `/api/master-console/`:

#### Clients Management
```
GET    /api/master-console/sellers               # List all clients
GET    /api/master-console/sellers/{id}          # Get client details
POST   /api/master-console/sellers               # Create new client
PUT    /api/master-console/sellers/{id}          # Update client
PUT    /api/master-console/sellers/{id}/activate
PUT    /api/master-console/sellers/{id}/deactivate
DELETE /api/master-console/sellers/{id}          # Hard delete
```

#### E-commerce Platforms
```
GET    /api/master-console/ecom-platforms        # List all platforms
GET    /api/master-console/ecom-platforms/active
GET    /api/master-console/ecom-platforms/inactive
POST   /api/master-console/ecom-platforms        # Create platform
PUT    /api/master-console/ecom-platforms/{id}   # Update platform
PUT    /api/master-console/ecom-platforms/{id}/activate
PUT    /api/master-console/ecom-platforms/{id}/deactivate
DELETE /api/master-console/ecom-platforms/{id}
```

#### Storage Configuration
```
GET    /api/master-console/storage-configs          # List all
GET    /api/master-console/storage-configs/seller/{sellerId}
POST   /api/master-console/storage-configs          # Create config
PUT    /api/master-console/storage-configs/{id}     # Update config
PUT    /api/master-console/storage-configs/{id}/activate
PUT    /api/master-console/storage-configs/{id}/deactivate
DELETE /api/master-console/storage-configs/{id}
```

## Multi-Tenant Data Isolation

### Database Level
- **Single database** shared by all clients
- **Data isolated by seller_id** on all relevant tables (Order, StorageConfig, etc.)
- Authentication enforces tenant context through User.seller relationship

### Application Level

**Client Portal:**
- All queries automatically filtered by logged-in user's seller_id
- User can only see their own seller's data
- No cross-seller leakage possible

**Master Console:**
- Admin operations see all sellers/clients
- Can manage configuration for any client
- Separate authentication/authorization layer

### JWT Token Strategy (Future Enhancement)

When fully implemented:
```javascript
// Client Portal JWT
{
  "sub": "user@client.com",
  "seller_id": 42,        // Identifies which seller this user belongs to
  "role": "SELLER_OWNER",
  "exp": ...
}

// Master Console JWT
{
  "sub": "admin@company.com",
  "role": "ADMIN",        // No seller_id - admin context
  "exp": ...
}
```

## Setup Instructions

### 1. Backend

```bash
cd vms-backend
mvn spring-boot:run
# Server runs on http://localhost:8080
```

### 2. Client Portal Frontend

```bash
cd vms-backend/vms-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. Master Console Frontend

```bash
cd vms-backend/vms-master-console
npm install
npm run dev
# Runs on http://localhost:5174
```

### 4. Database Setup

```bash
createdb vms_db
psql -d vms_db < schema.sql  # If provided
```

Update `application.yml` with credentials.

## Typical Workflows

### Admin Workflow (Master Console)

1. **Login** to Master Console (admin credentials)
2. **Add a new client/seller**
   - Name, email, phone
   - System auto-creates seller record
3. **Configure platforms** (global, reusable for all clients)
   - Add "Flipkart", "Amazon", "JioMart", etc.
4. **Configure storage for this client**
   - Client A → Google Drive
   - Client B → AWS S3
   - Client C → Local NAS
   - All configured without code changes
5. **View cross-client dashboard** (if implemented)
   - Activity across all clients
   - Status of uploads
   - Client health metrics

### Client Workflow (Client Portal)

1. **Client owner receives login credentials** from admin
2. **Logs in** to their client portal
3. **Creates packing staff users** (if needed) - currently via API/backend
4. **Packing staff scans barcodes and records videos**
   - Videos uploaded to the storage backend configured by admin
   - No UI for changing storage - it's managed by admin
5. **Owner views dashboard** - sees their own upload activity
   - Status: done, pending, failed
   - Videos by platform
   - Trends (if charts implemented)

## Migration from Old Architecture

**Old:** Single-seller portal with configuration UI
↓
**New:** Multi-tenant with admin console + client portal

### What Clients Experience

- ❌ **Removed:** Configuration page (storage, platforms)
- ✅ **Kept:** Dashboard, Scanning, Upload
- ✅ **Same:** Authentication, packing workflow

### What Admins Get

- ✅ **New:** Master Console to manage all clients
- ✅ **New:** Configure storage per client
- ✅ **New:** Manage platforms globally
- ✅ **New:** Activate/deactivate clients
- ✅ **Future:** Cross-client dashboards and analytics

## Future Enhancements

1. **Multi-Database Tenancy** (Phase 2)
   - Each client gets their own database/schema
   - Further isolation and data security

2. **Master Console Analytics** (Phase 2)
   - Cross-client dashboards
   - SLA monitoring
   - Usage reports

3. **Billing & Usage Tracking** (Phase 3)
   - Track video uploads per client
   - Storage costs per client
   - Invoice generation

4. **API Keys for Integrations** (Phase 3)
   - Allow clients to upload via API
   - Webhooks for video processing events

## Important Notes for Developers

### When Adding New Features

1. **Client Portal Pages** → Add to `vms-frontend/src/pages/`
2. **Admin Pages** → Add to `vms-master-console/src/pages/`
3. **Shared Backend Logic** → Add to `/service/` or `/controller/`
4. **Admin-Only Endpoints** → Add to `MasterConsole*Controller.java`
5. **Client Endpoints** → Add to regular `*Controller.java` (filter by seller_id)

### Security Checklist

- [ ] All seller queries include `WHERE seller_id = ?`
- [ ] Client portal users cannot access admin endpoints
- [ ] Admin console cannot access individual client portals
- [ ] JWT validation enforces role-based access
- [ ] Sensitive data (credentials, API keys) never logged

### Testing Multi-Tenant Isolation

```bash
# Test 1: Create two sellers
curl -X POST http://localhost:8080/api/master-console/sellers \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"businessName": "Client A", ...}'

# Test 2: Upload video as seller 1
curl -X POST http://localhost:8080/api/packing-videos/{barcode}/upload \
  -H "Authorization: Bearer $CLIENT1_TOKEN" \
  -F "file=@video.mp4"

# Test 3: Verify seller 2 cannot see seller 1's video
curl http://localhost:8080/api/dashboard/by-platform \
  -H "Authorization: Bearer $CLIENT2_TOKEN"
  # Should show 0 videos
```

## Support & Troubleshooting

**Q: How do I add a new client?**
A: Use Master Console → Clients page, or API: POST /api/master-console/sellers

**Q: Can a client see another client's data?**
A: No. All queries filter by seller_id. Data is completely isolated.

**Q: Where do I configure storage for a client?**
A: Master Console → Storage Config page. NOT in the client portal.

**Q: What if I need to migrate an existing client to this new system?**
A: 
1. Create client record in Master Console
2. Export their existing data (if any)
3. Update user accounts to link to new seller record
4. Configure their storage backend in Master Console

---

**Last Updated:** 2024-07-26  
**Version:** 2.0.0 (Multi-Tenant Architecture)
