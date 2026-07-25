package com.vms.storage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vms.entity.StorageConfig;
import com.vms.enums.StorageProviderType;
import com.vms.repository.StorageConfigRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * The heart of the "no-code" storage switch. Given a sellerId and platformId,
 * looks up the active StorageConfig row and instantiates the matching
 * StorageProvider on the fly. Changing a customer's storage destination (or their
 * video naming convention) is just an update to a DB row via the admin UI --
 * no deployment required.
 *
 * Resolution order:
 *   1. Exact match: seller + specific platform (e.g. seller wants Amazon videos on S3)
 *   2. Fallback: seller + platform=null (seller's default for all platforms)
 */
@Component
public class StorageProviderFactory {

    private final StorageConfigRepository storageConfigRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StorageProviderFactory(StorageConfigRepository storageConfigRepository) {
        this.storageConfigRepository = storageConfigRepository;
    }

    public StorageProvider resolve(Long sellerId, Long platformId) throws IOException, GeneralSecurityException {
        return build(resolveConfig(sellerId, platformId));
    }

    /** Exposes the raw config too -- e.g. so callers can read videoNamingSource or record providerType used. */
    public StorageConfig resolveConfig(Long sellerId, Long platformId) {
        return storageConfigRepository
                .findBySeller_IdAndPlatform_IdAndActiveTrue(sellerId, platformId)
                .or(() -> storageConfigRepository.findBySeller_IdAndPlatformIsNullAndActiveTrue(sellerId))
                .orElseThrow(() -> new IllegalStateException(
                        "No active storage config found for sellerId=" + sellerId + ", platformId=" + platformId));
    }

    private StorageProvider build(StorageConfig config) throws IOException, GeneralSecurityException {
        JsonNode creds = objectMapper.readTree(config.getCredentialsJson());
        StorageProviderType type = config.getProviderType();

        return switch (type) {
            case LOCAL -> new LocalStorageProvider(creds.get("basePath").asText());

            case S3 -> new S3StorageProvider(
                    creds.get("bucket").asText(),
                    creds.get("region").asText(),
                    creds.get("accessKey").asText(),
                    creds.get("secretKey").asText());

            case GOOGLE_DRIVE -> new GoogleDriveStorageProvider(
                    creds.get("clientId").asText(),
                    creds.get("clientSecret").asText(),
                    creds.get("refreshToken").asText(),
                    creds.get("folderId").asText());
        };
    }
}
