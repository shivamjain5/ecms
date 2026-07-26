package com.vms.controller;

import com.vms.dto.LoginRequest;
import com.vms.dto.LoginResponse;
import com.vms.dto.RegisterRequest;
import com.vms.dto.UserProfileResponse;
import com.vms.entity.Seller;
import com.vms.entity.User;
import com.vms.enums.UserRole;
import com.vms.repository.SellerRepository;
import com.vms.repository.UserRepository;
import com.vms.security.JwtService;
import com.vms.security.UserPrincipal;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        String rawEmail = request.email();
        String email = rawEmail != null ? rawEmail.trim() : null;
        log.info("Authentication attempt for email='{}' trimmedEmail='{}' length={} ", rawEmail, email, email == null ? 0 : email.length());

        User user = userRepository.findByEmail(email).orElse(null);
        List<User> user1=userRepository.findAll();
        if (user != null) {
            log.debug("Stored DB password hash for email='{}': {}", email, user.getPasswordHash());
        } else {
            log.debug("No user found for email='{}'", email);
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException ex) {
            log.warn("Authentication failed for email='{}' enteredPassword='{}' storedPasswordHash='{}' reason={}",
                    email,
                    request.password(),
                    user != null ? user.getPasswordHash() : "<none>",
                    ex.getMessage());
            throw ex;
        }

        if (user == null) {
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("User not found after authentication"));
        }

        String token = jwtService.generateToken(new UserPrincipal(user));
        log.info("Authentication successful for email={} role={}", user.getEmail(), user.getRole());
        return new LoginResponse(token, user.getEmail(), user.getRole().name());
    }

    /**
     * Basic self-registration for a seller owner account. In production, gate this
     * behind an admin-only endpoint or an invite-token flow instead of leaving it open.
     */
    @PostMapping("/register")
    public LoginResponse register(@RequestBody RegisterRequest request) {
        log.info("Register attempt for email={} role={}", request.email(), request.role());
        Seller seller = request.sellerId() != null
                ? sellerRepository.findById(request.sellerId()).orElse(null)
                : null;

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(UserRole.valueOf(request.role()))
                .seller(seller)
                .active(true)
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(new UserPrincipal(user));
        return new LoginResponse(token, user.getEmail(), user.getRole().name());
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = currentUser.getUser();
        Seller seller = user.getSeller();

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                seller != null ? seller.getId() : null,
                seller != null ? seller.getBusinessName() : null
        );
    }
}
