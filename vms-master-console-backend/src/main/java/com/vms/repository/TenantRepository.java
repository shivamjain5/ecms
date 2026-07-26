package com.vms.repository;

import com.vms.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findByActiveTrue();
    
    List<Tenant> findByActiveFalse();
    
    Optional<Tenant> findByContactEmail(String contactEmail);
    
    Optional<Tenant> findByVmsDbSellerId(Long vmsDbSellerId);
    
    @Query("SELECT t FROM Tenant t WHERE t.businessName LIKE %:search% OR t.contactEmail LIKE %:search%")
    List<Tenant> searchByNameOrEmail(String search);
}
