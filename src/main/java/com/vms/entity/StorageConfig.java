package com.vms.entity;

import com.vms.enums.StorageProviderType;
import com.vms.enums.VideoNamingSource;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Drives two "no-code, per customer demand" switches:
 *  1. Which storage backend (Drive/S3/Local) a seller's (or seller+platform's) videos go to.
 *  2. What the saved video filename is based on (order number by default, or AWB number).
 *
 * One row per (seller, platform) combination, or a single row per seller with
 * platform = null to act as the default for all platforms that don't have their own row.
 *
 * credentialsJson holds provider-specific settings, e.g.:
 *  - GOOGLE_DRIVE: { "folderId": "...", "refreshToken": "..." }
 *  - S3:           { "bucket": "...", "region": "...", "accessKey": "...", "secretKey": "..." }
 *  - LOCAL:        { "basePath": "/mnt/vms-storage" }
 *
 * Store this encrypted at rest (e.g. via Jasypt or a KMS) in a real deployment.
 */
@Entity
@Table(name = "storage_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    /** Null = applies to all platforms for this seller unless a more specific row exists. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_id")
    private EcomPlatform platform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StorageProviderType providerType;

    @Lob
    @Column(nullable = false)
    private String credentialsJson;

    /** Default is ORDER_NUMBER; a customer can request AWB_NUMBER instead, per seller or per platform. */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VideoNamingSource videoNamingSource = VideoNamingSource.ORDER_NUMBER;

    @Builder.Default
    private boolean active = true;
}
