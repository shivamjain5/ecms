package com.vms.controller;

import com.vms.entity.EcomPlatform;
import com.vms.repository.EcomPlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * MASTER CONSOLE ONLY - Admin management of e-commerce platforms.
 *
 * In multi-tenant architecture:
 * - Master console admin configures which platforms are available
 * - Platforms can be assigned per seller (future: per-seller platform filtering)
 * - For now, all sellers see all active platforms (can be restricted later)
 *
 * Client portal users see GET /api/ecom-platforms (public, limited to active only)
 * but cannot create/delete/modify platforms.
 */
@RestController
@RequestMapping("/api/master-console/ecom-platforms")
@RequiredArgsConstructor
public class MasterConsoleEcomPlatformController {

    private final EcomPlatformRepository ecomPlatformRepository;

    /**
     * Admin only: List all platforms (active and inactive).
     */
    @GetMapping
    public List<EcomPlatform> listAll() {
        return ecomPlatformRepository.findAll();
    }

    /**
     * Admin only: List active platforms only.
     */
    @GetMapping("/active")
    public List<EcomPlatform> listActive() {
        return ecomPlatformRepository.findByActiveTrue();
    }

    /**
     * Admin only: List inactive platforms only.
     */
    @GetMapping("/inactive")
    public List<EcomPlatform> listInactive() {
        return ecomPlatformRepository.findByActiveFalse();
    }

    /**
     * Admin only: Create a new e-commerce platform.
     *
     * Code will be normalized to uppercase, spaces replaced with underscores.
     * Example: "Jio Mart" -> "JIO_MART"
     */
    @PostMapping
    public EcomPlatform create(@RequestBody EcomPlatform platform) {
        // Normalize code: uppercase and replace spaces with underscores
        String normalizedCode = platform.getCode()
                .toUpperCase()
                .replaceAll("\\s+", "_");

        platform.setCode(normalizedCode);
        platform.setActive(true);

        return ecomPlatformRepository.save(platform);
    }

    /**
     * Admin only: Update platform details.
     */
    @PutMapping("/{id}")
    public EcomPlatform update(@PathVariable Long id, @RequestBody EcomPlatform payload) {
        EcomPlatform existing = ecomPlatformRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Platform not found: " + id));

        existing.setDisplayName(payload.getDisplayName());
        // Note: code is typically not editable after creation to avoid breaking folder structures

        return ecomPlatformRepository.save(existing);
    }

    /**
     * Admin only: Activate a platform (make visible to clients).
     */
    @PutMapping("/{id}/activate")
    public EcomPlatform activate(@PathVariable Long id) {
        EcomPlatform platform = ecomPlatformRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Platform not found: " + id));
        platform.setActive(true);
        return ecomPlatformRepository.save(platform);
    }

    /**
     * Admin only: Deactivate a platform (hide from clients).
     * Existing videos using this platform are preserved.
     */
    @PutMapping("/{id}/deactivate")
    public EcomPlatform deactivate(@PathVariable Long id) {
        EcomPlatform platform = ecomPlatformRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Platform not found: " + id));
        platform.setActive(false);
        return ecomPlatformRepository.save(platform);
    }

    /**
     * Admin only: Delete a platform.
     * WARNING: This will cascade if there are references.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        ecomPlatformRepository.deleteById(id);
    }
}
