package com.vms.controller;

import com.vms.entity.Tenant;
import com.vms.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Master Console API for managing tenants (clients/sellers)
 * Admin-only endpoints
 */
@RestController
@RequestMapping("/api/master-console/sellers")
@RequiredArgsConstructor
public class MasterConsoleTenantController {

    private final TenantRepository tenantRepository;
    private final JdbcTemplate jdbcTemplate;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    private final Map<Long, String> emailOtps = new ConcurrentHashMap<>();
    private final Map<Long, String> mobileOtps = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> emailVerified = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> mobileVerified = new ConcurrentHashMap<>();

    /**
     * List tenants, optionally filtering by active state.
     */
    @GetMapping
    public ResponseEntity<List<Tenant>> listTenants(@RequestParam(required = false) Boolean active) {
        List<Tenant> tenants;
        if (active == null) {
            tenants = tenantRepository.findAll();
        } else if (active) {
            tenants = tenantRepository.findByActiveTrue();
        } else {
            tenants = tenantRepository.findByActiveFalse();
        }
        return ResponseEntity.ok(tenants);
    }

    @PostMapping("/{id}/send-email-otp")
    public ResponseEntity<?> sendEmailOtp(@PathVariable Long id) {
        Optional<Tenant> tenant = tenantRepository.findById(id);
        if (tenant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        String email = tenant.get().getContactEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Tenant does not have a contact email.");
        }
        String otp = generateOtp();
        emailOtps.put(id, otp);
        emailVerified.put(id, false);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(email);
            helper.setFrom("vmsonline1881@gmail.com");
            helper.setSubject("Your VMS Go-Live OTP");
            String body = "Your OTP for VMS Go-Live is: " + otp + "\nThis code is valid for a short time.";
            helper.setText(body, false);
            mailSender.send(message);
            return ResponseEntity.ok(Map.of("message", "Email OTP sent."));
        } catch (Exception ex) {
            // don't fail the flow — keep OTP stored and log it so admins can proceed in development
            System.err.println("[GoLive] Failed to send email OTP to " + email + ": " + ex.getMessage());
            System.err.println("[GoLive] OTP for tenant " + id + " is: " + otp);
            return ResponseEntity.ok(Map.of("message", "OTP generated but email send failed; OTP logged on server."));
        }
    }

    @PostMapping("/{id}/verify-email-otp")
    public ResponseEntity<?> verifyEmailOtp(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String otp = request.get("otp");
        if (otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body("OTP is required.");
        }
        String expected = emailOtps.get(id);
        if (expected == null || !expected.equals(otp.trim())) {
            return ResponseEntity.badRequest().body("Invalid email OTP.");
        }
        emailVerified.put(id, true);
        emailOtps.remove(id);
        return ResponseEntity.ok(Map.of("message", "Email verified."));
    }

    @PostMapping("/{id}/send-mobile-otp")
    public ResponseEntity<?> sendMobileOtp(@PathVariable Long id) {
        // Mobile verification is disabled in this deployment - only email verification is required
        return ResponseEntity.ok(Map.of("message", "Mobile verification disabled; only email verification is required."));
    }

    @PostMapping("/{id}/verify-mobile-otp")
    public ResponseEntity<?> verifyMobileOtp(@PathVariable Long id, @RequestBody Map<String, String> request) {
        // Mobile verification is disabled; mark as not required
        return ResponseEntity.ok(Map.of("message", "Mobile verification disabled; no action needed."));
    }

    private String generateOtp() {
        int otp = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(otp);
    }

    /**
     * Get tenant by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Tenant> getTenant(@PathVariable Long id) {
        Optional<Tenant> tenant = tenantRepository.findById(id);
        return tenant.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new tenant
     */
    @PostMapping
    public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
        tenant.setId(null);
        tenant.setActive(false);
        Tenant saved = tenantRepository.save(tenant);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Go live tenant: create schema, required tables, default metadata, and activate the tenant.
     */
    @PostMapping("/{id}/go-live")
    @Transactional
    public ResponseEntity<?> goLiveTenant(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Optional<Tenant> existing = tenantRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tenant tenant = existing.get();
        String schemaName = sanitizeSchemaName(request.get("schemaName"));
        if (schemaName == null || schemaName.isBlank()) {
            return ResponseEntity.badRequest().body("Schema name is required.");
        }
        if (tenant.getActive() != null && tenant.getActive()) {
            return ResponseEntity.badRequest().body("Tenant is already live.");
        }
        if (!Boolean.TRUE.equals(emailVerified.get(id))) {
            return ResponseEntity.badRequest().body("Email must be verified before running go-live.");
        }

        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schemaName + "\"");
        // Create tenant-scoped tables based on vms backend entities
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".sellers (id SERIAL PRIMARY KEY, business_name VARCHAR(255) NOT NULL, contact_email VARCHAR(255) UNIQUE NOT NULL, contact_phone VARCHAR(50), active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".ecom_platforms (id SERIAL PRIMARY KEY, code VARCHAR(100) UNIQUE NOT NULL, display_name VARCHAR(255) NOT NULL, active BOOLEAN DEFAULT TRUE)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(255), role VARCHAR(50) NOT NULL, seller_id INTEGER, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".warehouses (id SERIAL PRIMARY KEY, seller_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, address TEXT)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".cameras (id SERIAL PRIMARY KEY, warehouse_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, rtsp_url TEXT NOT NULL, online BOOLEAN DEFAULT FALSE, recording_enabled BOOLEAN DEFAULT TRUE)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".orders (id SERIAL PRIMARY KEY, seller_id INTEGER NOT NULL, order_barcode VARCHAR(255) UNIQUE NOT NULL, order_number VARCHAR(255), awb_number VARCHAR(255), platform_id INTEGER NOT NULL, customer_name VARCHAR(255), product_name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".packing_videos (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL, staff_id INTEGER, local_temp_path TEXT NOT NULL, final_storage_path TEXT, storage_provider VARCHAR(50), upload_status VARCHAR(50) DEFAULT 'PENDING', duration_seconds INTEGER, file_size_bytes BIGINT, recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".cctv_recordings (id SERIAL PRIMARY KEY, camera_id INTEGER NOT NULL, local_temp_path TEXT, final_storage_path TEXT, storage_provider VARCHAR(50), upload_status VARCHAR(50) DEFAULT 'PENDING', start_time TIMESTAMP NOT NULL, end_time TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".storage_configs (id SERIAL PRIMARY KEY, seller_id INTEGER NOT NULL, platform_id INTEGER, provider_type VARCHAR(50) NOT NULL, credentials_json TEXT NOT NULL, video_naming_source VARCHAR(50), active BOOLEAN DEFAULT TRUE)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".tenant_metadata (id SERIAL PRIMARY KEY, meta_key VARCHAR(100) NOT NULL, meta_value TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".storage_settings (id SERIAL PRIMARY KEY, provider_type VARCHAR(50), credentials_json TEXT, naming_source VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS \"" + schemaName + "\".audit_log (id SERIAL PRIMARY KEY, event_type VARCHAR(100), event_source VARCHAR(100), event_payload TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

        // Create an admin user for the tenant using the tenant ID as the explicit user id
        Long explicitUserId = tenant.getId();
        String adminEmail = tenant.getContactEmail() != null ? tenant.getContactEmail() : "admin@tenant.local";
        String adminPassword = passwordEncoder.encode("123456"); // default provisioning password
        jdbcTemplate.update("INSERT INTO \"" + schemaName + "\".users (id, email, password_hash, full_name, role, active) VALUES (?, ?, ?, ?, ?, ?)", explicitUserId, adminEmail, adminPassword, tenant.getBusinessName(), "ADMIN", true);
        jdbcTemplate.update("INSERT INTO \"" + schemaName + "\".tenant_metadata (meta_key, meta_value) VALUES (?, ?)", "tenant_id", String.valueOf(tenant.getId()));
        jdbcTemplate.update("INSERT INTO \"" + schemaName + "\".storage_settings (provider_type, credentials_json, naming_source) VALUES (?, ?, ?)", "LOCAL_NAS", "{}", "ORDER_BARCODE");

        tenant.setActive(true);
        // store the schema/brand name on the tenant so client portal can resolve it later
        tenant.setBrandName(schemaName);
        tenantRepository.save(tenant);
        emailVerified.remove(id);
        mobileVerified.remove(id);

        return ResponseEntity.ok(Map.of("message", "Client is live", "schema", schemaName));
    }

    private String sanitizeSchemaName(String schemaName) {
        if (schemaName == null) {
            return null;
        }
        String safe = schemaName.trim().replaceAll("[^A-Za-z0-9_]", "_").toLowerCase();
        return safe.length() > 0 ? safe : null;
    }

    /**
     * Update tenant
     */
    @PutMapping("/{id}")
    public ResponseEntity<Tenant> updateTenant(@PathVariable Long id, @RequestBody Tenant tenantData) {
        Optional<Tenant> existing = tenantRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tenant tenant = existing.get();
        if (tenantData.getBusinessName() != null) {
            tenant.setBusinessName(tenantData.getBusinessName());
        }
        if (tenantData.getContactEmail() != null) {
            tenant.setContactEmail(tenantData.getContactEmail());
        }
        if (tenantData.getContactPhone() != null) {
            tenant.setContactPhone(tenantData.getContactPhone());
        }
        if (tenantData.getBrandName() != null) {
            tenant.setBrandName(tenantData.getBrandName());
        }
        if (tenantData.getGstinNumber() != null) {
            tenant.setGstinNumber(tenantData.getGstinNumber());
        }
        if (tenantData.getAddress() != null) {
            tenant.setAddress(tenantData.getAddress());
        }
        if (tenantData.getPincode() != null) {
            tenant.setPincode(tenantData.getPincode());
        }
        if (tenantData.getSubscriptionTier() != null) {
            tenant.setSubscriptionTier(tenantData.getSubscriptionTier());
        }

        Tenant updated = tenantRepository.save(tenant);
        return ResponseEntity.ok(updated);
    }

    /**
     * Activate tenant
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<Tenant> activateTenant(@PathVariable Long id) {
        Optional<Tenant> existing = tenantRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tenant tenant = existing.get();
        tenant.setActive(true);
        Tenant updated = tenantRepository.save(tenant);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deactivate tenant (soft delete)
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Tenant> deactivateTenant(@PathVariable Long id) {
        Optional<Tenant> existing = tenantRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Tenant tenant = existing.get();
        tenant.setActive(false);
        Tenant updated = tenantRepository.save(tenant);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete tenant (hard delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable Long id) {
        if (!tenantRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tenantRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
