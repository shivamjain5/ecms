package com.vms.dto;

public record UserProfileResponse(
        Long userId,
        String email,
        String fullName,
        String role,
        Long sellerId,
        String sellerName
) {
}
