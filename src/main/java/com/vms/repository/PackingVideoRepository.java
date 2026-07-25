package com.vms.repository;

import com.vms.entity.PackingVideo;
import com.vms.enums.UploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackingVideoRepository extends JpaRepository<PackingVideo, Long> {

    List<PackingVideo> findByUploadStatus(UploadStatus status);

    List<PackingVideo> findByOrder_OrderBarcode(String orderBarcode);

    long countByOrder_Platform_Id(Long platformId);
}
