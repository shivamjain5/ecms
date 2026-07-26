package com.vms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Tenant entity for Master Console
 * Represents a seller/client in the multi-tenant system
 * Master Console manages all tenants across all instances
 */
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "tenants", indexes = {
    @Index(name = "idx_tenants_active", columnList = "active"),
    @Index(name = "idx_tenants_business_name", columnList = "business_name")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String businessName;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = true)
    private String contactPhone;

    @Column(nullable = true)
    private String brandName;

    @Column(nullable = true)
    private String gstinNumber;

    @Column(nullable = true, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = true)
    private String pincode;

    @Column(nullable = false)
    private String subscriptionTier = "BASIC";  // BASIC, PRO, ENTERPRISE

    @Column(nullable = false)
    private Boolean active = true;

    /**
     * Reference to the corresponding seller.id in vms_db
     * Used for syncing data between systems
     */
    @Column(nullable = true)
    private Long vmsDbSellerId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private AdminUser updatedBy;
}
