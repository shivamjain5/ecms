package com.vms.service;

import com.vms.entity.EcomPlatform;
import com.vms.enums.UploadStatus;
import com.vms.repository.EcomPlatformRepository;
import com.vms.repository.PackingVideoRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class DashboardService {

    private final PackingVideoRepository packingVideoRepository;
    private final EcomPlatformRepository ecomPlatformRepository;

    public DashboardService(PackingVideoRepository packingVideoRepository,
                             EcomPlatformRepository ecomPlatformRepository) {
        this.packingVideoRepository = packingVideoRepository;
        this.ecomPlatformRepository = ecomPlatformRepository;
    }

    /** Powers the "videos by platform" pie/bar chart -- reflects whatever platforms are currently configured. */
    public Map<String, Long> videosByPlatform() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (EcomPlatform platform : ecomPlatformRepository.findByActiveTrue()) {
            result.put(platform.getDisplayName(), packingVideoRepository.countByOrder_Platform_Id(platform.getId()));
        }
        return result;
    }

    /** Powers the upload success/failure chart. */
    public Map<String, Long> uploadStatusBreakdown() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (UploadStatus s : UploadStatus.values()) {
            result.put(s.name(), (long) packingVideoRepository.findByUploadStatus(s).size());
        }
        return result;
    }
}
