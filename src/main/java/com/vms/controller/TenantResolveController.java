package com.vms.controller;

import com.vms.multitenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/tenant")
public class TenantResolveController {

    private final JdbcTemplate jdbcTemplate;

    public TenantResolveController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/resolve")
    public ResponseEntity<?> resolve(@RequestBody Map<String, String> body) {
        String company = body.get("companyName");
        if (company == null || company.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "companyName is required"));
        }
        // Query public.tenants for brandName or businessName match
        String sql = "SELECT id, business_name, brand_name FROM public.tenants WHERE business_name = ? OR brand_name = ? OR contact_email = ? LIMIT 1";
        var rows = jdbcTemplate.queryForList(sql, company, company, company);
        if (rows.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Tenant not found"));
        }
        var row = rows.get(0);
        String brand = row.get("brand_name") != null ? row.get("brand_name").toString() : row.get("business_name").toString();
        String schema = brand.trim().toLowerCase().replaceAll("[^a-z0-9_]+", "_");
        return ResponseEntity.ok(Map.of("tenantId", row.get("id"), "brand", brand, "schema", schema));
    }
}
