package com.vms.controller;

import com.vms.entity.StorageConfig;
import com.vms.entity.Tenant;
import com.vms.repository.StorageConfigRepository;
import com.vms.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * Master Console API for managing storage configurations per tenant
 * This is the core "no-code configuration" feature
 * Admin-only endpoints
 */
@RestController
@RequestMapping("/api/master-console/storage-configs")
@RequiredArgsConstructor
public class MasterConsoleStorageConfigController {

    private final StorageConfigRepository storageConfigRepository;
    private final TenantRepository tenantRepository;

    /**
     * List all storage configurations
     */
    @GetMapping
    public ResponseEntity<List<StorageConfig>> listConfigs() {
        List<StorageConfig> configs = storageConfigRepository.findAll();
        return ResponseEntity.ok(configs);
    }

    /**
     * List configurations for a specific tenant/seller
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<StorageConfig>> getConfigsByTenant(@PathVariable Long sellerId) {
        Optional<Tenant> tenant = tenantRepository.findById(sellerId);
        if (tenant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<StorageConfig> configs = storageConfigRepository.findByTenant(tenant.get());
        return ResponseEntity.ok(configs);
    }

    /**
     * Get configuration by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<StorageConfig> getConfig(@PathVariable Long id) {
        Optional<StorageConfig> config = storageConfigRepository.findById(id);
        return config.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new storage configuration for a tenant
     * 
     * Request body example:
     * {
     *   "tenantId": 1,
     *   "platformId": 1,
     *   "providerType": "AWS_S3",
     *   "credentialsJson": "{\"bucket\": \"my-bucket\", \"region\": \"us-east-1\"}",
     *   "namingSource": "ORDER_BARCODE"
     * }
     */
    @PostMapping
    public ResponseEntity<?> createConfig(@RequestBody StorageConfig config) {
        if (config.getTenant() == null || config.getTenant().getId() == null) {
            return ResponseEntity.badRequest().body("Tenant ID is required");
        }

        Optional<Tenant> tenant = tenantRepository.findById(config.getTenant().getId());
        if (tenant.isEmpty()) {
            return ResponseEntity.badRequest().body("Tenant not found");
        }

        config.setId(null);
        config.setActive(true);
        config.setTenant(tenant.get());

        StorageConfig saved = storageConfigRepository.save(config);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Update storage configuration
     */
    @PutMapping("/{id}")
    public ResponseEntity<StorageConfig> updateConfig(@PathVariable Long id, @RequestBody StorageConfig configData) {
        Optional<StorageConfig> existing = storageConfigRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StorageConfig config = existing.get();
        
        if (configData.getProviderType() != null) {
            config.setProviderType(configData.getProviderType());
        }
        if (configData.getCredentialsJson() != null) {
            config.setCredentialsJson(configData.getCredentialsJson());
        }
        if (configData.getNamingSource() != null) {
            config.setNamingSource(configData.getNamingSource());
        }

        StorageConfig updated = storageConfigRepository.save(config);
        return ResponseEntity.ok(updated);
    }

    /**
     * Activate storage configuration
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<StorageConfig> activateConfig(@PathVariable Long id) {
        Optional<StorageConfig> existing = storageConfigRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StorageConfig config = existing.get();
        config.setActive(true);
        StorageConfig updated = storageConfigRepository.save(config);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deactivate storage configuration (soft delete)
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<StorageConfig> deactivateConfig(@PathVariable Long id) {
        Optional<StorageConfig> existing = storageConfigRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StorageConfig config = existing.get();
        config.setActive(false);
        StorageConfig updated = storageConfigRepository.save(config);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete storage configuration (hard delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        if (!storageConfigRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        storageConfigRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
