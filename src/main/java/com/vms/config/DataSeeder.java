package com.vms.config;

import com.vms.entity.EcomPlatform;
import com.vms.repository.EcomPlatformRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds a starter list of common marketplaces on first run so the "which website?"
 * dropdown isn't empty out of the box. Admins can add more anytime via
 * POST /api/ecom-platforms -- this is just a convenience default, not a fixed list.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final EcomPlatformRepository ecomPlatformRepository;

    public DataSeeder(EcomPlatformRepository ecomPlatformRepository) {
        this.ecomPlatformRepository = ecomPlatformRepository;
    }

    @Override
    public void run(String... args) {
        if (ecomPlatformRepository.count() > 0) return;

        List<EcomPlatform> defaults = List.of(
                EcomPlatform.builder().code("FLIPKART").displayName("Flipkart").active(true).build(),
                EcomPlatform.builder().code("AMAZON").displayName("Amazon").active(true).build(),
                EcomPlatform.builder().code("MEESHO").displayName("Meesho").active(true).build(),
                EcomPlatform.builder().code("MYNTRA").displayName("Myntra").active(true).build(),
                EcomPlatform.builder().code("JIOMART").displayName("JioMart").active(true).build(),
                EcomPlatform.builder().code("OWN_WEBSITE").displayName("Own Website").active(true).build(),
                EcomPlatform.builder().code("OTHER").displayName("Other").active(true).build()
        );

        ecomPlatformRepository.saveAll(defaults);
    }
}
