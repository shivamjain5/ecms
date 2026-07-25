package com.vms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents an e-commerce marketplace a seller sells on (Flipkart, Amazon, Meesho, ...).
 * Kept as a DB table rather than an enum specifically so an admin can add a brand-new
 * marketplace from the UI at any time -- no code change or redeploy needed.
 *
 * Seeded with common Indian marketplaces by default; sellers/admins can add more via
 * POST /api/ecom-platforms.
 */
@Entity
@Table(name = "ecom_platforms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EcomPlatform {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable short code used in folder paths/filenames, e.g. "FLIPKART", "AMAZON". Uppercase, no spaces. */
    @Column(nullable = false, unique = true)
    private String code;

    /** What's shown in the dropdown UI, e.g. "Flipkart", "Amazon", "JioMart". */
    @Column(nullable = false)
    private String displayName;

    @Builder.Default
    private boolean active = true;
}
