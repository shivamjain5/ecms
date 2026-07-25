package com.vms.controller;

import com.vms.dto.LoginRequest;
import com.vms.dto.LoginResponse;
import com.vms.dto.RegisterRequest;
import com.vms.entity.Seller;
import com.vms.entity.User;
import com.vms.enums.UserRole;
import com.vms.repository.SellerRepository;
import com.vms.repository.UserRepository;
import com.vms.security.JwtService;
import com.vms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("User not found after authentication"));

        String token = jwtService.generateToken(new UserPrincipal(user));
        return new LoginResponse(token, user.getEmail(), user.getRole().name());
    }

    /**
     * Basic self-registration for a seller owner account. In production, gate this
     * behind an admin-only endpoint or an invite-token flow instead of leaving it open.
     */
    @PostMapping("/register")
    public LoginResponse register(@RequestBody RegisterRequest request) {
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
}
