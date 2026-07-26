package com.vms.controller;

import com.vms.entity.Platform;
import com.vms.repository.PlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * Master Console API for managing global e-commerce platforms
 * Admin-only endpoints
 */
@RestController
@RequestMapping("/api/master-console/ecom-platforms")
@RequiredArgsConstructor
public class MasterConsolePlatformController {

    private final PlatformRepository platformRepository;

    /**
     * List all platforms (active and inactive)
     */
    @GetMapping
    public ResponseEntity<List<Platform>> listPlatforms() {
        List<Platform> platforms = platformRepository.findAll();
        return ResponseEntity.ok(platforms);
    }

    /**
     * List only active platforms
     */
    @GetMapping("/active")
    public ResponseEntity<List<Platform>> listActivePlatforms() {
        List<Platform> platforms = platformRepository.findByActiveTrue();
        return ResponseEntity.ok(platforms);
    }

    /**
     * List only inactive platforms
     */
    @GetMapping("/inactive")
    public ResponseEntity<List<Platform>> listInactivePlatforms() {
        List<Platform> platforms = platformRepository.findByActiveFalse();
        return ResponseEntity.ok(platforms);
    }

    /**
     * Get platform by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Platform> getPlatform(@PathVariable Long id) {
        Optional<Platform> platform = platformRepository.findById(id);
        return platform.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new platform
     * Code is normalized: uppercase, spaces -> underscores
     */
    @PostMapping
    public ResponseEntity<Platform> createPlatform(@RequestBody Platform platform) {
        platform.setId(null);
        platform.setActive(true);
        
        // Normalize code: uppercase, spaces to underscores
        String normalizedCode = platform.getCode()
                .toUpperCase()
                .replaceAll("\\s+", "_");
        platform.setCode(normalizedCode);

        Platform saved = platformRepository.save(platform);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Update platform
     */
    @PutMapping("/{id}")
    public ResponseEntity<Platform> updatePlatform(@PathVariable Long id, @RequestBody Platform platformData) {
        Optional<Platform> existing = platformRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Platform platform = existing.get();
        if (platformData.getDisplayName() != null) {
            platform.setDisplayName(platformData.getDisplayName());
        }

        Platform updated = platformRepository.save(platform);
        return ResponseEntity.ok(updated);
    }

    /**
     * Activate platform
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<Platform> activatePlatform(@PathVariable Long id) {
        Optional<Platform> existing = platformRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Platform platform = existing.get();
        platform.setActive(true);
        Platform updated = platformRepository.save(platform);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deactivate platform (soft delete)
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Platform> deactivatePlatform(@PathVariable Long id) {
        Optional<Platform> existing = platformRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Platform platform = existing.get();
        platform.setActive(false);
        Platform updated = platformRepository.save(platform);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete platform (hard delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlatform(@PathVariable Long id) {
        if (!platformRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        platformRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
