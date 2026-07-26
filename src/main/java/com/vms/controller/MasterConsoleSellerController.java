package com.vms.controller;

import com.vms.entity.Seller;
import com.vms.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * MASTER CONSOLE ONLY - Admin operations for managing sellers/clients in multi-tenant environment.
 * 
 * This controller is meant to be accessed only from the Master Console application,
 * NOT from individual client portals.
 * 
 * All operations are admin-only (ROLE_ADMIN in master console context).
 * The client portal does NOT include these endpoints.
 */
@RestController
@RequestMapping("/api/master-console/sellers")
@RequiredArgsConstructor
public class MasterConsoleSellerController {

    private final SellerRepository sellerRepository;

    /**
     * Admin only: List all sellers/clients with filtering options.
     * Returns all sellers managed in the system.
     */
    @GetMapping
    public List<Seller> list(
            @RequestParam(required = false) Boolean active
    ) {
        if (active != null) {
            // Could implement filtering by active status
            // For now, return all
        }
        return sellerRepository.findAll();
    }

    /**
     * Admin only: Get details of a specific seller/client.
     */
    @GetMapping("/{id}")
    public Seller getById(@PathVariable Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found: " + id));
    }

    /**
     * Admin only: Create a new client/seller.
     * Initializes with active=true.
     */
    @PostMapping
    public Seller create(@RequestBody Seller seller) {
        seller.setActive(true);
        return sellerRepository.save(seller);
    }

    /**
     * Admin only: Update seller/client information.
     * Cannot change: createdAt (audit field)
     * Can change: businessName, contactEmail, contactPhone, active status
     */
    @PutMapping("/{id}")
    public Seller update(@PathVariable Long id, @RequestBody Seller payload) {
        Seller existing = sellerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found: " + id));
        
        existing.setBusinessName(payload.getBusinessName());
        existing.setContactEmail(payload.getContactEmail());
        existing.setContactPhone(payload.getContactPhone());
        existing.setActive(payload.isActive());
        
        return sellerRepository.save(existing);
    }

    /**
     * Admin only: Activate a seller/client account.
     * When active=true, all client portal operations are allowed.
     */
    @PutMapping("/{id}/activate")
    public Seller activate(@PathVariable Long id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found: " + id));
        seller.setActive(true);
        return sellerRepository.save(seller);
    }

    /**
     * Admin only: Deactivate a seller/client account.
     * When active=false, client portal users cannot log in or upload videos.
     * All historical data is preserved.
     */
    @PutMapping("/{id}/deactivate")
    public Seller deactivate(@PathVariable Long id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found: " + id));
        seller.setActive(false);
        return sellerRepository.save(seller);
    }

    /**
     * Admin only: Delete a seller account (hard delete).
     * WARNING: This will cascade delete all related data (users, orders, videos, storage configs).
     * Use deactivate() instead for soft deletion.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        sellerRepository.deleteById(id);
    }
}
