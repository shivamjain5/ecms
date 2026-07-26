package com.vms.controller;

import com.vms.entity.StorageConfig;
import com.vms.repository.StorageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * MASTER CONSOLE ONLY - Admin management of storage configurations per seller/client.
 * 
 * In multi-tenant architecture:
 * - Master console admin configures storage backends for each seller
 * - This is where you set whether seller A uses Google Drive vs S3 vs Local storage
 * - Client portal users do NOT see this - it's all configured by admin
 * - Video naming source (ORDER_NUMBER vs AWB_NUMBER) is configured here
 * 
 * Client portal has NO storage configuration UI at all.
 */
@RestController
@RequestMapping("/api/master-console/storage-configs")
@RequiredArgsConstructor
public class MasterConsoleStorageConfigController {

    private final StorageConfigRepository storageConfigRepository;

    /**
     * Admin only: List all storage configurations (across all sellers).
     */
    @GetMapping
    public List<StorageConfig> listAll() {
        return storageConfigRepository.findAll();
    }

    /**
     * Admin only: Get storage configurations for a specific seller.
     * 
     * @param sellerId The seller to list configs for
     * @return List of storage configs for that seller
     */
    @GetMapping("/seller/{sellerId}")
    public List<StorageConfig> listBySeller(@PathVariable Long sellerId) {
        // Could implement a repository method like findBySeller_Id
        // For now, return filtered from findAll
        return storageConfigRepository.findAll().stream()
                .filter(sc -> sc.getSeller().getId().equals(sellerId))
                .toList();
    }

    /**
     * Admin only: Create a new storage configuration for a seller.
     * 
     * This tells the system:
     * - Seller X
     * - (Optionally) Platform Y
     * - Should use provider Z (S3, GoogleDrive, Local)
     * - With these credentials
     * - Videos should be named using this source (ORDER_NUMBER or AWB_NUMBER)
     * 
     * @param config The storage config to create
     * @return The created config
     */
    @PostMapping
    public StorageConfig create(@RequestBody StorageConfig config) {
        config.setActive(true);
        return storageConfigRepository.save(config);
    }

    /**
     * Admin only: Update a storage configuration.
     * Allows changing provider type, credentials, or naming source on the fly.
     * This is a key "no code deployment" feature - no restart needed.
     * 
     * @param id The config ID
     * @param payload The updated config
     * @return The updated config
     */
    @PutMapping("/{id}")
    public StorageConfig update(@PathVariable Long id, @RequestBody StorageConfig payload) {
        StorageConfig existing = storageConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Storage config not found: " + id));
        
        existing.setProviderType(payload.getProviderType());
        existing.setCredentialsJson(payload.getCredentialsJson());
        existing.setVideoNamingSource(payload.getVideoNamingSource());
        existing.setActive(payload.isActive());
        
        // Note: seller and platform are typically not editable after creation
        
        return storageConfigRepository.save(existing);
    }

    /**
     * Admin only: Activate a storage configuration.
     * Videos will be uploaded using this configuration.
     */
    @PutMapping("/{id}/activate")
    public StorageConfig activate(@PathVariable Long id) {
        StorageConfig config = storageConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Storage config not found: " + id));
        config.setActive(true);
        return storageConfigRepository.save(config);
    }

    /**
     * Admin only: Deactivate a storage configuration.
     * Videos will not be uploaded using this config.
     * Useful for emergency pause or migrations.
     */
    @PutMapping("/{id}/deactivate")
    public StorageConfig deactivate(@PathVariable Long id) {
        StorageConfig config = storageConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Storage config not found: " + id));
        config.setActive(false);
        return storageConfigRepository.save(config);
    }

    /**
     * Admin only: Delete a storage configuration.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        storageConfigRepository.deleteById(id);
    }
}
