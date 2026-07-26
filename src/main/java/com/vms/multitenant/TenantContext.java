package com.vms.multitenant;

public class TenantContext {
    private static final ThreadLocal<String> current = new ThreadLocal<>();

    public static void setCurrentTenant(String tenant) {
        current.set(tenant);
    }

    public static String getCurrentTenant() {
        return current.get();
    }

    public static void clear() {
        current.remove();
    }
}
