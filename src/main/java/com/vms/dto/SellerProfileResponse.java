package com.vms.dto;

import java.time.Instant;

public record SellerProfileResponse(
        Long id,
        String businessName,
        String contactEmail,
        String contactPhone,
        boolean active,
        Instant createdAt
) {
}
