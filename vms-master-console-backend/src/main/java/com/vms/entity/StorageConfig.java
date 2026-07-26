package com.vms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * StorageConfig entity for Master Console
 * Configures where videos are stored for each tenant/platform combination
 * This is the core "no-code" configuration feature
 */
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "storage_configs", indexes = {
    @Index(name = "idx_storage_configs_tenant", columnList = "tenant_id"),
    @Index(name = "idx_storage_configs_platform", columnList = "platform_id"),
    @Index(name = "idx_storage_configs_active", columnList = "active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StorageConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_id")
    private Platform platform;  // Null = default storage for tenant

    @Column(nullable = false)
    private String providerType;  // GOOGLE_DRIVE, AWS_S3, LOCAL_NAS

    @Column(nullable = false, columnDefinition = "TEXT")
    private String credentialsJson;  // Provider-specific credentials (should encrypt in production)

    @Column(nullable = false)
    private String namingSource;  // How to name videos: ORDER_ID, ORDER_BARCODE, TIMESTAMP_RANDOM, etc.

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    /**
     * Get human-readable description of this config
     * Example: "Tenant A - JIO_MART: AWS S3"
     */
    public String getDescription() {
        String platformPart = platform != null ? platform.getDisplayName() : "Default";
        return String.format("%s - %s: %s", tenant.getBusinessName(), platformPart, providerType);
    }
}
