package com.vms.repository;

import com.vms.entity.CctvRecording;
import com.vms.enums.UploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface CctvRecordingRepository extends JpaRepository<CctvRecording, Long> {
    List<CctvRecording> findByUploadStatus(UploadStatus status);

    List<CctvRecording> findByCamera_IdAndStartTimeBetween(Long cameraId, Instant from, Instant to);
}
