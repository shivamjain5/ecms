package com.vms.dto;

public record SellerProfileUpdateRequest(
        String businessName,
        String contactPhone
) {
}
