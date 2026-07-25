package com.vms.controller;

import com.vms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/videos-by-platform")
    public Map<String, Long> videosByPlatform() {
        return dashboardService.videosByPlatform();
    }

    @GetMapping("/upload-status")
    public Map<String, Long> uploadStatusBreakdown() {
        return dashboardService.uploadStatusBreakdown();
    }
}
