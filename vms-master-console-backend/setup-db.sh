#!/bin/bash
# Master Console Database Setup Script

# Create the vms_master_db database if it doesn't exist
psql -U postgres -h localhost -c "CREATE DATABASE vms_master_db;" 2>/dev/null || echo "Database may already exist"

echo "✅ vms_master_db database created (or already exists)"
echo "Flyway migrations will run automatically when Master Console backend starts"
