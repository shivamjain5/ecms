@echo off
REM Master Console Database Setup Script (Windows)

REM Create the vms_master_db database if it doesn't exist
psql -U postgres -h localhost -c "CREATE DATABASE vms_master_db;" 2>nul

echo.
echo ===================================
echo Master Console Database Setup
echo ===================================
echo.
echo vms_master_db database created (or already exists)
echo Flyway migrations will run automatically when Master Console backend starts
echo.
echo Next steps:
echo 1. Start Master Console backend: mvn spring-boot:run
echo 2. Check logs to see Flyway migrations running
echo 3. Master Console database is ready!
echo.
pause
