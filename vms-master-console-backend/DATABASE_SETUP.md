# Master Console Database Setup Guide

## Overview

Master Console uses a **separate PostgreSQL database** (`vms_master_db`) to maintain complete architectural separation from the Client Portal database (`vms_db`).

```
vms_db              vms_master_db
├── sellers         ├── tenants (Master Console manages)
├── users           ├── admin_users
├── orders          ├── platforms (Global)
├── videos          ├── storage_configs
└── ...             └── audit_logs
↑                   ↑
Client Portal       Master Console Backend
(port 8080)         (port 8081)
```

## Database Schema

### Tables

**admin_users**
- Admin credentials and profile
- Who creates/updates tenants and configurations

**tenants**
- Seller/client accounts managed by Master Console
- Includes reference to corresponding seller in vms_db (for data sync)
- Subscription tier tracking (BASIC, PRO, ENTERPRISE)

**platforms**
- Global e-commerce platforms (JIO_MART, AMAZON, FLIPKART, etc.)
- Available to all tenants
- Master Console is source of truth

**storage_configs**
- Per-tenant storage backend configuration
- Specifies: provider (Google Drive, S3, Local), credentials, file naming
- This is the core "no-code" feature

**audit_logs**
- Compliance and troubleshooting
- Tracks all admin actions

## Setup Steps

### 1. Create the Database

**On Linux/Mac:**
```bash
cd vms-master-console-backend
bash setup-db.sh
```

**On Windows:**
```cmd
cd vms-master-console-backend
setup-db.bat
```

**Or manually:**
```sql
CREATE DATABASE vms_master_db;
```

### 2. Start Master Console Backend

```bash
cd vms-master-console-backend
mvn spring-boot:run
```

**What happens:**
1. Spring Boot starts (port 8081)
2. Flyway detects vms_master_db is empty
3. Flyway runs `V1__init_master_console_schema.sql`
4. Tables are created
5. Default admin account is inserted
   - Email: `admin@vms.local`
   - Password hash: bcrypt (hashed from: admin123)
6. Backend is ready for requests

### 3. Access Master Console

- Frontend: http://localhost:5174
- Backend API: http://localhost:8081
- Docs: Check `src/main/java/com/vms/controller/` for endpoints

## Data Sync Between Databases

**Master Console is the source of truth for:**
- Tenants (sellers)
- Platforms
- Storage configurations

**How to sync to Client Portal database (vms_db):**

Option A: Write to both (application logic)
- When Master Console creates a tenant, also insert into vms_db.sellers
- Pro: Real-time sync, separate data models
- Con: Two DB writes, more complex

Option B: Master Console reads from vms_db
- Keep Master Console as admin interface but read actual seller data from vms_db
- Pro: Single source of truth
- Con: Less architectural separation

**Current recommendation:** 
Use a one-way sync service that watches Master Console and updates vms_db when tenant/platform/config changes. This gives clean separation with eventual consistency.

Example flow:
1. Admin creates tenant in Master Console UI
2. API creates record in vms_master_db.tenants
3. Event published or batch job syncs to vms_db.sellers
4. Client Portal reads from vms_db as before

## Default Admin Account

After first migration:

- **Email:** admin@vms.local
- **Password:** admin123 (change this!)

This account is auto-inserted by the migration script. Change the password immediately in production.

## Troubleshooting

### "Connection refused" error

```
HikariPool-1 - Starting...
Failed to obtain connection
```

**Solution:**
1. Ensure PostgreSQL is running: `psql --version`
2. Run setup script to create vms_master_db: `setup-db.bat` (Windows) or `setup-db.sh` (Linux/Mac)
3. Check credentials in application.yml (default: postgres/password)
4. Verify database is accessible:
   ```sql
   psql -U postgres -d vms_master_db
   ```

### "Table does not exist" error

**Solution:**
- Flyway migration failed to run
- Check Master Console backend logs for migration errors
- Verify `src/main/resources/db/migration/V1__init_master_console_schema.sql` exists
- Delete vms_master_db and restart backend to re-run migrations

### Application starts but endpoints 404

**Solution:**
- Ensure you're calling port 8081 (Master Console), not 8080 (Client Portal)
- Correct: `http://localhost:8081/api/master-console/sellers`
- Wrong: `http://localhost:8080/api/master-console/sellers`

## Next Steps

1. Implement tenant CRUD endpoints that read/write to new vms_master_db
2. Implement platform CRUD endpoints
3. Implement storage config CRUD endpoints
4. Build Master Console frontend pages to use these APIs
5. Setup sync mechanism to propagate tenant changes to Client Portal database
