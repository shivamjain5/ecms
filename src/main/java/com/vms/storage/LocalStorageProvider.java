package com.vms.storage;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Writes files to a configured local disk path -- typically a mounted NAS/network share.
 * basePath comes from StorageConfig.credentialsJson: { "basePath": "/mnt/vms-storage" }
 */
public class LocalStorageProvider implements StorageProvider {

    private final String basePath;

    public LocalStorageProvider(String basePath) {
        this.basePath = basePath;
    }

    @Override
    public String upload(File localFile, String remotePath) throws IOException {
        Path destination = Path.of(basePath, remotePath);
        Files.createDirectories(destination.getParent());
        Files.copy(localFile.toPath(), destination, StandardCopyOption.REPLACE_EXISTING);
        return destination.toAbsolutePath().toString();
    }

    @Override
    public String getPlaybackUrl(String finalStoragePath) {
        // In practice, expose via a controller endpoint like /api/videos/stream?path=...
        // rather than a raw filesystem path, and enforce auth/ownership checks there.
        return "/api/videos/stream?path=" + finalStoragePath;
    }

    @Override
    public void delete(String finalStoragePath) throws IOException {
        Files.deleteIfExists(Path.of(finalStoragePath));
    }
}
