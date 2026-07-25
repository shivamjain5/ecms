package com.vms.dto;

public record RegisterRequest(String email, String password, String fullName, String role, Long sellerId) {
}
