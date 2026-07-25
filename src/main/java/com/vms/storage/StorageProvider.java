package com.vms.storage;

import java.io.File;
import java.io.IOException;

/**
 * Common contract every storage backend must implement.
 * Callers (upload workers) never know or care whether the file is going to
 * Google Drive, S3, or a local/NAS path -- that decision is made purely by
 * config at runtime via {@link StorageProviderFactory}.
 */
public interface StorageProvider {

    /**
     * Uploads/copies the given local file to the destination described by
     * remotePath (a relative key such as "sellerId/FLIPKART/2026-07-25/ORD123_143210.mp4").
     *
     * @return the final reference to the stored file (S3 key, Google Drive file ID,
     *         or absolute local path) -- this gets saved as finalStoragePath.
     */
    String upload(File localFile, String remotePath) throws IOException;

    /**
     * Produces a URL or reference the frontend can use to stream/play the video back.
     * For S3 this would be a pre-signed URL; for Drive a webViewLink; for local, an
     * internal API endpoint that streams the file.
     */
    String getPlaybackUrl(String finalStoragePath) throws IOException;

    /** Deletes the stored file -- used by retention-policy cleanup jobs. */
    void delete(String finalStoragePath) throws IOException;
}
