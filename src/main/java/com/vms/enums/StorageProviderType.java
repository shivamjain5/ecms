package com.vms.enums;

/**
 * Determines which StorageProvider implementation the factory hands out.
 * A seller (or a seller+platform combination) picks this from the portal UI --
 * no code change or redeployment needed to switch.
 */
public enum StorageProviderType {
    GOOGLE_DRIVE,
    S3,
    LOCAL
}
