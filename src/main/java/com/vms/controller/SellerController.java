package com.vms.controller;

import com.vms.entity.Seller;
import com.vms.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * MASTER CONSOLE ONLY - Admin operations for managing sellers/clients.
 * 
 * Client portal users (SELLER_OWNER, VIEWER, PACKING_STAFF) should NOT have access to these endpoints.
 * These are protected by role-based authorization (see SecurityConfig).
 * 
 * In multi-tenant architecture:
 * - All seller CRUD operations happen here
 * - Client portal does NOT include these endpoints
 * - Master console is separate application with different authentication/authorization
 */
@RestController
@RequestMapping("/api/sellers")
@RequiredArgsConstructor
public class SellerController {

    private final SellerRepository sellerRepository;

    /**
     * Admin only: List all sellers/clients.
     */
    @GetMapping
    public List<Seller> list() {
        return sellerRepository.findAll();
    }

    /**
     * Admin only: Create a new client/seller.
     */
    @PostMapping
    public Seller create(@RequestBody Seller seller) {
        seller.setActive(true);
        return sellerRepository.save(seller);
    }

    /**
     * Admin only: Update seller information.
     */
    @PutMapping("/{id}")
    public Seller update(@PathVariable Long id, @RequestBody Seller payload) {
        Seller existing = sellerRepository.findById(id).orElseThrow();
        existing.setBusinessName(payload.getBusinessName());
        existing.setContactEmail(payload.getContactEmail());
        existing.setContactPhone(payload.getContactPhone());
        existing.setActive(payload.isActive());
        return sellerRepository.save(existing);
    }

    /**
     * Admin only: Activate a seller/client.
     */
    @PutMapping("/{id}/activate")
    public void activate(@PathVariable Long id) {
        Seller seller = sellerRepository.findById(id).orElseThrow();
        seller.setActive(true);
        sellerRepository.save(seller);
    }

    /**
     * Admin only: Deactivate a seller/client.
     */
    @PutMapping("/{id}/deactivate")
    public void deactivate(@PathVariable Long id) {
        Seller seller = sellerRepository.findById(id).orElseThrow();
        seller.setActive(false);
        sellerRepository.save(seller);
    }
}

