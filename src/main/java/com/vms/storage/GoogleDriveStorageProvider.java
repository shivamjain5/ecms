package com.vms.storage;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.FileContent;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.auth.oauth2.UserCredentials;
import com.google.auth.http.HttpCredentialsAdapter;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Uploads to a Google Drive folder using a pre-authorized OAuth refresh token
 * (obtained once via the standard Google OAuth consent flow when the seller
 * connects their Drive account in the portal's settings screen).
 *
 * Config from StorageConfig.credentialsJson:
 * { "folderId": "...", "clientId": "...", "clientSecret": "...", "refreshToken": "..." }
 */
public class GoogleDriveStorageProvider implements StorageProvider {

    private final Drive driveService;
    private final String folderId;

    public GoogleDriveStorageProvider(String clientId, String clientSecret, String refreshToken, String folderId)
            throws GeneralSecurityException, IOException {
        this.folderId = folderId;

        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();

        this.driveService = new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("VMS")
                .build();
    }

    @Override
    public String upload(java.io.File localFile, String remotePath) throws IOException {
        com.google.api.services.drive.model.File fileMetadata = new com.google.api.services.drive.model.File();
        // remotePath e.g. "sellerId/FLIPKART/2026-07-25/ORD123_143210.mp4" -- Drive has no real
        // folder hierarchy from a key like S3, so we just use the last segment as filename
        // and rely on `folderId` (per seller/platform, configured via StorageConfig) for placement.
        String fileName = remotePath.substring(remotePath.lastIndexOf('/') + 1);
        fileMetadata.setName(fileName);
        fileMetadata.setParents(Collections.singletonList(folderId));

        FileContent mediaContent = new FileContent("video/mp4", localFile);
        com.google.api.services.drive.model.File uploaded = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id, webViewLink")
                .execute();

        return uploaded.getId();
    }

    @Override
    public String getPlaybackUrl(String finalStoragePath) throws IOException {
        com.google.api.services.drive.model.File file = driveService.files().get(finalStoragePath)
                .setFields("webViewLink")
                .execute();
        return file.getWebViewLink();
    }

    @Override
    public void delete(String finalStoragePath) throws IOException {
        driveService.files().delete(finalStoragePath).execute();
    }
}
