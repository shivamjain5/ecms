-- Add extended tenant fields for brand, GSTIN, address, and pincode
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS gstin_number VARCHAR(64),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
