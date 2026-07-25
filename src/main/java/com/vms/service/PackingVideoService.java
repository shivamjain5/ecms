package com.vms.service;

import com.vms.entity.EcomPlatform;
import com.vms.entity.Order;
import com.vms.entity.PackingVideo;
import com.vms.entity.User;
import com.vms.enums.UploadStatus;
import com.vms.repository.EcomPlatformRepository;
import com.vms.repository.OrderRepository;
import com.vms.repository.PackingVideoRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PackingVideoService {

    private final OrderRepository orderRepository;
    private final PackingVideoRepository packingVideoRepository;
    private final EcomPlatformRepository ecomPlatformRepository;

    // Where the React app's MediaRecorder upload lands before the background worker
    // ships it to Drive/S3/Local per the resolved StorageProvider.
    private final Path incomingDir = Path.of("/var/vms/incoming");

    public PackingVideoService(OrderRepository orderRepository,
                                PackingVideoRepository packingVideoRepository,
                                EcomPlatformRepository ecomPlatformRepository) {
        this.orderRepository = orderRepository;
        this.packingVideoRepository = packingVideoRepository;
        this.ecomPlatformRepository = ecomPlatformRepository;
    }

    /** Called when staff scans an order barcode -- confirms the order exists before recording starts. */
    public Order lookupOrderByBarcode(String barcode) {
        return orderRepository.findByOrderBarcode(barcode)
                .orElseThrow(() -> new IllegalArgumentException("No order found for barcode: " + barcode));
    }

    /**
     * Called once the browser finishes recording and POSTs the video blob.
     *
     * platformId is what the staff picked from the dropdown on the recording screen --
     * this both drives which storage config/folder is used AND gets stamped onto the
     * order if it wasn't already set (e.g. the order was auto-created from a raw scan
     * and didn't have a platform yet).
     */
    public PackingVideo registerRecordedVideo(String orderBarcode, User staff, MultipartFile videoFile,
                                               Integer durationSeconds, Long platformId) throws IOException {
        Order order = lookupOrderByBarcode(orderBarcode);

        if (platformId != null) {
            EcomPlatform selected = ecomPlatformRepository.findById(platformId)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown platform id: " + platformId));
            // Staff's dropdown selection always wins -- lets a seller correct a mis-tagged order too.
            order.setPlatform(selected);
            orderRepository.save(order);
        }

        Files.createDirectories(incomingDir);
        String originalExt = getExtension(videoFile.getOriginalFilename());
        String tempFileName = order.getOrderBarcode() + "_" + System.currentTimeMillis() + originalExt;
        Path localFile = incomingDir.resolve(tempFileName);
        videoFile.transferTo(localFile);

        PackingVideo video = PackingVideo.builder()
                .order(order)
                .packedByStaff(staff)
                .localTempPath(localFile.toString())
                .uploadStatus(UploadStatus.PENDING)
                .durationSeconds(durationSeconds)
                .fileSizeBytes(new File(localFile.toString()).length())
                .build();

        return packingVideoRepository.save(video);
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) return ".webm";
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
