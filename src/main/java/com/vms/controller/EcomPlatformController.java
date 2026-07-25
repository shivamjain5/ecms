package com.vms.controller;

import com.vms.entity.EcomPlatform;
import com.vms.repository.EcomPlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Manages the list of e-commerce marketplaces (shown as a dropdown on the packing/recording
 * screen). This is exactly the "add ecom website names, no code required" requirement --
 * an admin adds a row here and it's immediately selectable everywhere, including in
 * storage-config and dashboard breakdowns.
 */
@RestController
@RequestMapping("/api/ecom-platforms")
@RequiredArgsConstructor
public class EcomPlatformController {

    private final EcomPlatformRepository ecomPlatformRepository;

    /** Used by the packing screen to populate the "which website?" dropdown before recording. */
    @GetMapping
    public List<EcomPlatform> listActive() {
        return ecomPlatformRepository.findByActiveTrue();
    }

    /** Admin adds a new marketplace, e.g. { "code": "JIOMART", "displayName": "JioMart" }. */
    @PostMapping
    public EcomPlatform create(@RequestBody EcomPlatform platform) {
        platform.setCode(platform.getCode().toUpperCase().replaceAll("\\s+", "_"));
        return ecomPlatformRepository.save(platform);
    }

    @PutMapping("/{id}/deactivate")
    public void deactivate(@PathVariable Long id) {
        EcomPlatform platform = ecomPlatformRepository.findById(id).orElseThrow();
        platform.setActive(false);
        ecomPlatformRepository.save(platform);
    }
}
