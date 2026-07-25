package com.vms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cameras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false)
    private String name; // e.g. "Packing Floor - Cam 1"

    /** RTSP stream URL, e.g. rtsp://user:pass@192.168.1.10:554/stream1 */
    @Column(nullable = false)
    private String rtspUrl;

    @Builder.Default
    private boolean online = false;

    @Builder.Default
    private boolean recordingEnabled = true;
}
