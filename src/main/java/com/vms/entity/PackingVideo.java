package com.vms.entity;

import com.vms.enums.StorageProviderType;
import com.vms.enums.UploadStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "packing_videos", indexes = {
        @Index(name = "idx_pv_order", columnList = "order_id"),
        @Index(name = "idx_pv_status", columnList = "uploadStatus")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackingVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User packedByStaff;

    /** Temp local path where the browser upload lands before background job moves it. */
    @Column(nullable = false)
    private String localTempPath;

    /** Final path/key once uploaded (e.g. S3 key, Drive file ID, or local absolute path). */
    private String finalStoragePath;

    @Enumerated(EnumType.STRING)
    private StorageProviderType storageProvider;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UploadStatus uploadStatus = UploadStatus.PENDING;

    private Integer durationSeconds;

    private Long fileSizeBytes;

    @Builder.Default
    private Instant recordedAt = Instant.now();
}
