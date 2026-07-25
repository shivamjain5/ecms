package com.vms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_barcode", columnList = "orderBarcode"),
        @Index(name = "idx_order_platform", columnList = "platform_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    /** Whatever value is actually encoded in the barcode scanned at the packing station -- used for lookup. */
    @Column(nullable = false, unique = true)
    private String orderBarcode;

    /** The marketplace order ID, e.g. Flipkart/Amazon order number. Used for video naming when configured. */
    private String orderNumber;

    /** AWB / shipping tracking number, printed on the shipping label. Alternative video-naming source. */
    private String awbNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_id", nullable = false)
    private EcomPlatform platform;

    private String customerName;

    private String productName;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
