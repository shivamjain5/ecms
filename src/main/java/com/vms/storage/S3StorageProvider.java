package com.vms.storage;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.io.File;
import java.io.IOException;
import java.time.Duration;

/**
 * Uploads to an AWS S3 (or S3-compatible, e.g. MinIO/Wasabi) bucket.
 * Credentials come from StorageConfig.credentialsJson:
 * { "bucket": "...", "region": "ap-south-1", "accessKey": "...", "secretKey": "..." }
 */
public class S3StorageProvider implements StorageProvider {

    private final String bucket;
    private final S3Client s3Client;
    private final S3Presigner presigner;

    public S3StorageProvider(String bucket, String region, String accessKey, String secretKey) {
        this.bucket = bucket;
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .build();
        this.presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .build();
    }

    @Override
    public String upload(File localFile, String remotePath) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(remotePath)
                .build();
        s3Client.putObject(request, localFile.toPath());
        return remotePath; // the S3 key is the final reference
    }

    @Override
    public String getPlaybackUrl(String finalStoragePath) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(finalStoragePath)
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(2))
                .getObjectRequest(getRequest)
                .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public void delete(String finalStoragePath) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(finalStoragePath)
                .build());
    }
}
