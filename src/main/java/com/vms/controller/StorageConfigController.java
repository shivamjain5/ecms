package com.vms.controller;

import com.vms.entity.StorageConfig;
import com.vms.repository.StorageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Lets an admin/seller change storage backend (Drive/S3/Local) per seller or
 * per seller+platform entirely through the UI -- this is the "no code" switch.
 * Saving a row here is all that's needed for the next upload to use the new provider.
 */
@RestController
@RequestMapping("/api/storage-configs")
@RequiredArgsConstructor
public class StorageConfigController {

    private final StorageConfigRepository storageConfigRepository;

    @GetMapping("/seller/{sellerId}")
    public List<StorageConfig> listForSeller(@PathVariable Long sellerId) {
        return storageConfigRepository.findAll().stream()
                .filter(c -> c.getSeller().getId().equals(sellerId))
                .toList();
    }

    @PostMapping
    public StorageConfig upsert(@RequestBody StorageConfig config) {
        return storageConfigRepository.save(config);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        storageConfigRepository.deleteById(id);
    }
}
