package com.vms.controller;

import com.vms.entity.Order;
import com.vms.entity.PackingVideo;
import com.vms.security.UserPrincipal;
import com.vms.service.PackingVideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/packing-videos")
@RequiredArgsConstructor
public class PackingVideoController {

    private final PackingVideoService packingVideoService;

    /** Staff scans a barcode -- frontend calls this to confirm the order before starting the webcam recording. */
    @GetMapping("/lookup-order/{barcode}")
    public Order lookupOrder(@PathVariable String barcode) {
        return packingVideoService.lookupOrderByBarcode(barcode);
    }

    /**
     * Called once MediaRecorder finishes -- uploads the blob, background worker ships it onward.
     * platformId is whatever the staff picked in the "which website?" dropdown on the recording
     * screen -- it decides both the storage folder and (if the order didn't have one yet) gets
     * stamped onto the order.
     */
    @PostMapping(value = "/{orderBarcode}/upload", consumes = "multipart/form-data")
    public PackingVideo uploadVideo(@PathVariable String orderBarcode,
                                     @RequestParam("file") MultipartFile file,
                                     @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
                                     @RequestParam(value = "platformId", required = false) Long platformId,
                                     @AuthenticationPrincipal UserPrincipal currentUser) throws IOException {
        return packingVideoService.registerRecordedVideo(
                orderBarcode, currentUser.getUser(), file, durationSeconds, platformId);
    }
}
