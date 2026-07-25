package com.vms.repository;

import com.vms.entity.EcomPlatform;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EcomPlatformRepository extends JpaRepository<EcomPlatform, Long> {
    List<EcomPlatform> findByActiveTrue();
    Optional<EcomPlatform> findByCode(String code);
}
