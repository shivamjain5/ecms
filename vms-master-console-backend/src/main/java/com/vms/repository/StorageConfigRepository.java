package com.vms.repository;

import com.vms.entity.StorageConfig;
import com.vms.entity.Tenant;
import com.vms.entity.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StorageConfigRepository extends JpaRepository<StorageConfig, Long> {
    List<StorageConfig> findByTenant(Tenant tenant);
    
    List<StorageConfig> findByTenantAndActive(Tenant tenant, Boolean active);
    
    List<StorageConfig> findByPlatform(Platform platform);
    
    Optional<StorageConfig> findByTenantAndPlatformAndActiveTrue(Tenant tenant, Platform platform);
    
    Optional<StorageConfig> findByTenantAndPlatformIsNullAndActiveTrue(Tenant tenant);
    
    List<StorageConfig> findByActiveTrue();
}
