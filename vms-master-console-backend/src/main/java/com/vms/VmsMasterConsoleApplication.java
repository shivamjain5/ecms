package com.vms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * VMS Master Console Backend
 * 
 * Separate Spring Boot application serving admin endpoints at /api/master-console/*
 * Runs on port 8081 (separate from main VMS backend on 8080)
 * 
 * Responsibilities:
 * - Manage all seller/client accounts
 * - Configure global e-commerce platforms
 * - Configure storage backends per client
 * - Admin-only authorization
 * 
 * Database: Shared PostgreSQL with main backend (vms_db)
 * Authentication: JWT with admin-only role
 * CORS: Allows requests from Master Console frontend (port 5174)
 */
@SpringBootApplication
public class VmsMasterConsoleApplication {

    public static void main(String[] args) {
        // Allow loading mail credentials from files for improved secret handling.
        // If environment variables MAIL_PASSWORD_FILE or MAIL_USERNAME_FILE are set,
        // read the file contents and place them into system properties so Spring
        // placeholder resolution (e.g. ${MAIL_PASSWORD}) can use them.
        try {
            String pwFile = System.getenv("MAIL_PASSWORD_FILE");
            if (pwFile != null && !pwFile.isBlank()) {
                java.nio.file.Path p = java.nio.file.Path.of(pwFile);
                if (java.nio.file.Files.exists(p)) {
                    String secret = java.nio.file.Files.readString(p).trim();
                    if (!secret.isEmpty()) {
                        System.setProperty("MAIL_PASSWORD", secret);
                        System.out.println("[Config] Loaded MAIL_PASSWORD from file: " + pwFile);
                    }
                }
            }
            // Fallback: if not provided via env, try project-local secrets file (development convenience)
            if (System.getProperty("MAIL_PASSWORD") == null || System.getProperty("MAIL_PASSWORD").isBlank()) {
                java.nio.file.Path devPw = java.nio.file.Path.of("secrets", "mail_password.txt");
                if (java.nio.file.Files.exists(devPw)) {
                    String secretDev = java.nio.file.Files.readString(devPw).trim();
                    if (!secretDev.isEmpty()) {
                        System.setProperty("MAIL_PASSWORD", secretDev);
                        System.out.println("[Config] Loaded MAIL_PASSWORD from project file: " + devPw.toString());
                    }
                }
            }
            String userFile = System.getenv("MAIL_USERNAME_FILE");
            if (userFile != null && !userFile.isBlank()) {
                java.nio.file.Path p2 = java.nio.file.Path.of(userFile);
                if (java.nio.file.Files.exists(p2)) {
                    String user = java.nio.file.Files.readString(p2).trim();
                    if (!user.isEmpty()) {
                        System.setProperty("MAIL_USERNAME", user);
                        System.out.println("[Config] Loaded MAIL_USERNAME from file: " + userFile);
                    }
                }
            }
            if (System.getProperty("MAIL_USERNAME") == null || System.getProperty("MAIL_USERNAME").isBlank()) {
                java.nio.file.Path devUser = java.nio.file.Path.of("secrets", "mail_username.txt");
                if (java.nio.file.Files.exists(devUser)) {
                    String userDev = java.nio.file.Files.readString(devUser).trim();
                    if (!userDev.isEmpty()) {
                        System.setProperty("MAIL_USERNAME", userDev);
                        System.out.println("[Config] Loaded MAIL_USERNAME from project file: " + devUser.toString());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[Config] Failed to read mail credential files: " + e.getMessage());
        }

        SpringApplication.run(VmsMasterConsoleApplication.class, args);
    }
}
