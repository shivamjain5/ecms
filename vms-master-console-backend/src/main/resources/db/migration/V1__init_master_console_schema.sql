-- VMS Master Console Database Schema
-- Separate database: vms_master_db
-- Purpose: Admin management of all tenants, platforms, and configurations

-- Admins table
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenants (Sellers/Clients) - Master Console manages all tenants
CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    subscription_tier VARCHAR(50) DEFAULT 'BASIC',  -- BASIC, PRO, ENTERPRISE
    active BOOLEAN DEFAULT TRUE,
    vms_db_seller_id BIGINT,  -- Reference to seller.id in vms_db (for syncing)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES admin_users(id),
    updated_by BIGINT REFERENCES admin_users(id)
);

-- E-commerce Platforms (Global)
CREATE TABLE IF NOT EXISTS platforms (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,  -- JIO_MART, AMAZON, FLIPKART, etc.
    display_name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES admin_users(id)
);

-- Storage Configurations per Tenant
CREATE TABLE IF NOT EXISTS storage_configs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform_id BIGINT REFERENCES platforms(id),  -- Null = default for tenant
    provider_type VARCHAR(50) NOT NULL,  -- GOOGLE_DRIVE, AWS_S3, LOCAL_NAS
    credentials_json TEXT NOT NULL,  -- Encrypted credentials (should be encrypted in production)
    naming_source VARCHAR(50) NOT NULL,  -- ORDER_ID, ORDER_BARCODE, TIMESTAMP_RANDOM, etc.
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES admin_users(id)
);

-- Audit Log for compliance and troubleshooting
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type VARCHAR(100) NOT NULL,  -- TENANT, PLATFORM, STORAGE_CONFIG, etc.
    entity_id BIGINT,
    old_values TEXT,  -- JSON of previous values
    new_values TEXT,  -- JSON of new values
    admin_id BIGINT REFERENCES admin_users(id),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_tenants_business_name ON tenants(business_name);
CREATE INDEX idx_tenants_active ON tenants(active);
CREATE INDEX idx_tenants_vms_db_seller_id ON tenants(vms_db_seller_id);
CREATE INDEX idx_platforms_code ON platforms(code);
CREATE INDEX idx_storage_configs_tenant ON storage_configs(tenant_id);
CREATE INDEX idx_storage_configs_platform ON storage_configs(platform_id);
CREATE INDEX idx_storage_configs_active ON storage_configs(active);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default admin account
INSERT INTO admin_users (email, password_hash, full_name) 
VALUES ('admin@vms.local', '$2a$10$slYQmyNdGzin7olVN3p5Be7DlH.PKZbv5H8KnzzVgXXbVxzy990qm', 'System Admin')
ON CONFLICT DO NOTHING;
