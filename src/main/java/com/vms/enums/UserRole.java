package com.vms.enums;

public enum UserRole {
    ADMIN,          // manages multiple sellers/warehouses
    SELLER_OWNER,   // owns a seller account
    PACKING_STAFF,  // records packing videos
    VIEWER          // read-only, e.g. CCTV viewing only
}
