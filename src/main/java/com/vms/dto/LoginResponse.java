package com.vms.dto;

public record LoginResponse(String token, String email, String role) {
}
