package com.erp.backend.service;

import com.erp.backend.entity.Role;
import com.erp.backend.entity.User;
import com.erp.backend.repository.RoleRepository;
import com.erp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // Register a new user
    public User register(String username,
            String password, String roleName) {

        // Check if username already exists
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException(
                "Username already exists!");
        }

        // Find the role
        Role role = roleRepository.findByName(roleName);
        if (role == null) {
            throw new RuntimeException("Role not found!");
        }

        // Create new user with audit fields
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(1); // Active
        user.setCreatedBy("system"); // registered by system
        user.setUpdatedBy("system");

        return userRepository.save(user);
    }

    // Validate user login
    public User login(String username, String password) {

        // Find user by username
        User user = userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new RuntimeException("User not found!"));

        // Check if user is active
        if (user.getStatus() != null &&
                user.getStatus() == -1) {
            throw new RuntimeException(
                "Account is deactivated!");
        }

        // Check if user is inactive
        if (user.getStatus() != null &&
                user.getStatus() == 0) {
            throw new RuntimeException(
                "Account is inactive!");
        }

        // Check password
        if (!passwordEncoder.matches(
                password, user.getPassword())) {
            throw new RuntimeException("Invalid password!");
        }

        return user;
    }
}