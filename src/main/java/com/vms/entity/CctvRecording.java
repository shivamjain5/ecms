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
@Table(name = "cctv_recordings", indexes = {
        @Index(name = "idx_cctv_camera_time", columnList = "camera_id, startTime")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CctvRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id", nullable = false)
    private Camera camera;

    private String localTempPath;

    private String finalStoragePath;

    @Enumerated(EnumType.STRING)
    private StorageProviderType storageProvider;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UploadStatus uploadStatus = UploadStatus.PENDING;

    @Column(nullable = false)
    private Instant startTime;

    private Instant endTime;
}
