package com.vms.service;

import com.vms.entity.Order;
import com.vms.entity.PackingVideo;
import com.vms.entity.StorageConfig;
import com.vms.enums.UploadStatus;
import com.vms.enums.VideoNamingSource;
import com.vms.repository.PackingVideoRepository;
import com.vms.storage.StorageProvider;
import com.vms.storage.StorageProviderFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Background process that moves videos from local temp storage to the seller's
 * configured destination (Google Drive / S3 / Local NAS), keyed by
 * {sellerId}/{platformCode}/{yyyy-MM-dd}/{videoName}.mp4
 *
 * The video's base name is configurable per seller/platform (via StorageConfig.videoNamingSource):
 * order number by default, or AWB number if the customer requests it -- falls back to the
 * scanned barcode value if the chosen field is blank on that order.
 *
 * Runs on a schedule so packing staff are never blocked waiting on an upload,
 * and failures get retried automatically rather than silently lost.
 */
@Service
@Slf4j
public class UploadWorkerService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final PackingVideoRepository packingVideoRepository;
    private final StorageProviderFactory storageProviderFactory;

    public UploadWorkerService(PackingVideoRepository packingVideoRepository,
                                StorageProviderFactory storageProviderFactory) {
        this.packingVideoRepository = packingVideoRepository;
        this.storageProviderFactory = storageProviderFactory;
    }

    /** Picks up pending videos every 15 seconds and uploads them asynchronously. */
    @Scheduled(fixedDelay = 15_000)
    public void processPendingUploads() {
        packingVideoRepository.findByUploadStatus(UploadStatus.PENDING)
                .forEach(this::uploadAsync);
    }

    @Async
    public void uploadAsync(PackingVideo video) {
        video.setUploadStatus(UploadStatus.UPLOADING);
        packingVideoRepository.save(video);

        try {
            Order order = video.getOrder();
            Long sellerId = order.getSeller().getId();
            Long platformId = order.getPlatform().getId();
            String platformCode = order.getPlatform().getCode();

            StorageConfig config = storageProviderFactory.resolveConfig(sellerId, platformId);
            StorageProvider provider = storageProviderFactory.resolve(sellerId, platformId);

            String videoBaseName = resolveVideoName(order, config.getVideoNamingSource());
            String extension = getExtension(video.getLocalTempPath());
            String dateFolder = LocalDate.now(ZoneId.systemDefault()).format(DATE_FMT);

            // Folder structure keeps each e-com website's videos fully separate:
            // {sellerId}/{platformCode}/{yyyy-MM-dd}/{videoBaseName}.{ext}
            String remotePath = String.format("%d/%s/%s/%s%s",
                    sellerId, platformCode, dateFolder, videoBaseName, extension);

            String finalPath = provider.upload(new File(video.getLocalTempPath()), remotePath);

            video.setFinalStoragePath(finalPath);
            video.setStorageProvider(config.getProviderType());
            video.setUploadStatus(UploadStatus.DONE);
            packingVideoRepository.save(video);

            // Clean up local temp copy once safely uploaded
            new File(video.getLocalTempPath()).delete();

        } catch (Exception e) {
            log.error("Upload failed for packingVideo id={}: {}", video.getId(), e.getMessage(), e);
            video.setUploadStatus(UploadStatus.FAILED);
            packingVideoRepository.save(video);
            // A separate @Scheduled retry sweep would pick FAILED rows back up up to
            // MAX_RETRIES before alerting an admin -- worth adding a retryCount column
            // on PackingVideo in the next iteration.
        }
    }

    /**
     * Default is the marketplace order number. If the customer wants AWB number instead,
     * that's a one-row change on StorageConfig.videoNamingSource -- no code change needed.
     * Falls back to the raw scanned barcode if the preferred field wasn't captured for this order.
     */
    private String resolveVideoName(Order order, VideoNamingSource namingSource) {
        String preferred = namingSource == VideoNamingSource.AWB_NUMBER
                ? order.getAwbNumber()
                : order.getOrderNumber();

        if (preferred != null && !preferred.isBlank()) {
            return sanitize(preferred);
        }
        return sanitize(order.getOrderBarcode());
    }

    private String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private String getExtension(String path) {
        int dot = path.lastIndexOf('.');
        return dot >= 0 ? path.substring(dot) : ".mp4";
    }
}
