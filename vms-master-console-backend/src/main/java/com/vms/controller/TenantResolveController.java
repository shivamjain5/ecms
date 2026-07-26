package com.vms.controller;

import com.vms.entity.Tenant;
import com.vms.repository.TenantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/master-console")
public class TenantResolveController {

    private final TenantRepository tenantRepository;

    public TenantResolveController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @PostMapping("/resolve")
    public ResponseEntity<?> resolve(@RequestBody Map<String, String> body) {
        String company = body.get("companyName");
        if (company == null || company.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "companyName is required"));
        }
        // Try businessName, brandName, or contactEmail
        Tenant t = tenantRepository.findByContactEmail(company).orElse(null);
        if (t == null) {
            var list = tenantRepository.searchByNameOrEmail(company);
            if (!list.isEmpty()) t = list.get(0);
        }
        if (t == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Tenant not found"));
        }
        String brand = t.getBrandName() != null && !t.getBrandName().isBlank() ? t.getBrandName() : t.getBusinessName();
        String schema = brand.trim().toLowerCase().replaceAll("[^a-z0-9_]+", "_");
        return ResponseEntity.ok(Map.of("tenantId", t.getId(), "brand", brand, "schema", schema));
    }
}
