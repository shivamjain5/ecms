package com.vms.repository;

import com.vms.entity.StorageConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StorageConfigRepository extends JpaRepository<StorageConfig, Long> {

    Optional<StorageConfig> findBySeller_IdAndPlatform_IdAndActiveTrue(Long sellerId, Long platformId);

    Optional<StorageConfig> findBySeller_IdAndPlatformIsNullAndActiveTrue(Long sellerId);
}
