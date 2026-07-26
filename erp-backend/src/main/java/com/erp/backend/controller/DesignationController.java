package com.erp.backend.controller;

import com.erp.backend.entity.Designation;
import com.erp.backend.entity.User;
import com.erp.backend.repository.DesignationRepository;
import com.erp.backend.repository.UserRepository;
import com.erp.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/designations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DesignationController {

    private final DesignationRepository designationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    // Get current logged in username
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder
            .getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    // STATUS-FILTER-START
    // Get ALL designations with optional status filter
    @GetMapping
    public ResponseEntity<List<Designation>> getAll(
            @RequestParam(required = false) Integer status) {
        List<Designation> designations;
        if (status != null) {
            designations = designationRepository.findByStatus(status);
        } else {
            // Default: show all except deleted (-1)
            designations = designationRepository.findAll()
                .stream()
                .filter(d -> d.getStatus() == null ||
                    d.getStatus() != -1)
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(designations);
    }
    // STATUS-FILTER-END

    // Get designations by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Designation>> getByStatus(
            @PathVariable Integer status) {
        return ResponseEntity.ok(
            designationRepository.findAll()
                .stream()
                .filter(d -> d.getStatus() != null &&
                    d.getStatus().equals(status))
                .collect(Collectors.toList()));
    }

    // Get MY designation (Employee)
    @GetMapping("/my/{username}")
    public ResponseEntity<?> getMyDesignation(
            @PathVariable String username) {
        try {
            User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                    new RuntimeException("User not found!"));

            if (user.getDesignation() == null) {
                return ResponseEntity.ok(
                    "No designation assigned yet!");
            }

            return ResponseEntity.ok(user.getDesignation());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Get MY designation + Team designations (TL)
    @GetMapping("/team/{username}")
    public ResponseEntity<?> getTeamDesignations(
            @PathVariable String username) {
        try {
            User tl = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                    new RuntimeException("User not found!"));

            List<User> team = userRepository.findAll()
                .stream()
                .filter(u -> u.getTeamLeader() != null &&
                    u.getTeamLeader().getId()
                        .equals(tl.getId()))
                .collect(Collectors.toList());

            List<Map<String, Object>> result =
                new ArrayList<>();

            if (tl.getDesignation() != null) {
                Map<String, Object> tlDes = new HashMap<>();
                tlDes.put("username", tl.getUsername());
                tlDes.put("role", "TL (You)");
                tlDes.put("designation", tl.getDesignation());
                result.add(tlDes);
            }

            for (User member : team) {
                if (member.getDesignation() != null) {
                    Map<String, Object> memberDes = new HashMap<>();
                    memberDes.put("username", member.getUsername());
                    memberDes.put("role", "Employee");
                    memberDes.put("designation", member.getDesignation());
                    result.add(memberDes);
                }
            }

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Create new designation
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Designation designation) {
        try {
            String currentUser = getCurrentUsername();
            designation.setCreatedBy(currentUser);
            designation.setUpdatedBy(currentUser);
            designation.setStatus(1);
            Designation saved = designationRepository.save(designation);

            auditLogService.logCreate(
                "Designation",
                String.valueOf(saved.getId()),
                saved.getName(),
                currentUser
            );

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Update designation
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Designation designation) {
        return designationRepository.findById(id)
                .map(existing -> {
                    String currentUser = getCurrentUsername();

                    if (!existing.getName()
                            .equals(designation.getName())) {
                        auditLogService.logUpdate(
                            "Designation",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "name",
                            existing.getName(),
                            designation.getName(),
                            currentUser
                        );
                    }

                    if (existing.getDepartment() != null &&
                        !existing.getDepartment()
                            .equals(designation.getDepartment())) {
                        auditLogService.logUpdate(
                            "Designation",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "department",
                            existing.getDepartment(),
                            designation.getDepartment(),
                            currentUser
                        );
                    }

                    if (existing.getDescription() != null &&
                        !existing.getDescription()
                            .equals(designation.getDescription())) {
                        auditLogService.logUpdate(
                            "Designation",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "description",
                            existing.getDescription(),
                            designation.getDescription(),
                            currentUser
                        );
                    }

                    existing.setName(designation.getName());
                    existing.setDescription(designation.getDescription());
                    existing.setDepartment(designation.getDepartment());
                    existing.setUpdatedBy(currentUser);

                    return ResponseEntity.ok(
                        designationRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Soft Delete designation
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id) {
        try {
            String currentUser = getCurrentUsername();
            Designation designation =
                designationRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Designation not found!"));

            auditLogService.logDelete(
                "Designation",
                String.valueOf(designation.getId()),
                designation.getName(),
                currentUser
            );

            designation.setStatus(-1);
            designation.setDeletedAt(LocalDateTime.now());
            designation.setDeletedBy(currentUser);
            designationRepository.save(designation);

            return ResponseEntity.ok(
                "Designation deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }
}