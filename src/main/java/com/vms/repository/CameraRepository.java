package com.vms.repository;

import com.vms.entity.Camera;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CameraRepository extends JpaRepository<Camera, Long> {
    List<Camera> findByWarehouse_Id(Long warehouseId);
}
