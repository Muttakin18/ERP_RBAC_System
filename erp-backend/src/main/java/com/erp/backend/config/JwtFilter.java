package com.erp.backend.config;

import com.erp.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Skip filter for auth endpoints
            String path = request.getServletPath();
            if (path.startsWith("/api/auth/")) {
                filterChain.doFilter(request, response);
                return;
            }

            // Get Authorization header
            String authHeader = request
                .getHeader("Authorization");
            String token = null;
            String username = null;

            // Check if header starts with "Bearer "
            if (authHeader != null &&
                    authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                try {
                    username = jwtUtil
                        .extractUsername(token);
                } catch (Exception e) {
                    filterChain.doFilter(
                        request, response);
                    return;
                }
            }

            // If username found and not authenticated
            if (username != null &&
                SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                boolean userExists = userRepository
                    .findByUsername(username)
                    .isPresent();

                if (userExists && jwtUtil
                        .validateToken(token, username)) {
                    UserDetails userDetails = User
                        .builder()
                        .username(username)
                        .password("")
                        .authorities(new ArrayList<>())
                        .build();

                    UsernamePasswordAuthenticationToken
                        authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    authToken.setDetails(
                        new WebAuthenticationDetailsSource()
                            .buildDetails(request));

                    SecurityContextHolder.getContext()
                        .setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            System.out.println(
                "JWT Filter error: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}