package com.erp.backend.controller;

import com.erp.backend.entity.User;
import com.erp.backend.entity.Shift;
import com.erp.backend.entity.Designation;
import com.erp.backend.entity.Department;
import com.erp.backend.repository.UserRepository;
import com.erp.backend.repository.ShiftRepository;
import com.erp.backend.repository.DesignationRepository;
import com.erp.backend.repository.DepartmentRepository;
import com.erp.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final DesignationRepository designationRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    // Get current logged in username
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder
            .getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    // Get all users (exclude deleted)
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) Integer status) {
        
        List<User> users;
        
        if (status != null) {
            // If you ask for a specific status (e.g., /users?status=1)
            users = userRepository.findByStatus(status);
        } else {
            // If you don't provide a status, fetch EVERYONE from the database
            users = userRepository.findAll();
        }
        
        return ResponseEntity.ok(users);
    }

    // Get user by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get user by username
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(
            @PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get employees under a TL
    @GetMapping("/team/{tlId}")
    public ResponseEntity<?> getTeamByTL(
            @PathVariable Long tlId) {
        User tl = userRepository.findById(tlId)
                .orElseThrow(() ->
                    new RuntimeException("TL not found!"));
        List<User> team = userRepository.findAll()
                .stream()
                .filter(u -> u.getTeamLeader() != null &&
                    u.getTeamLeader().getId().equals(tlId)
                    && (u.getStatus() == null ||
                        u.getStatus() != -1))
                .collect(Collectors.toList());
        return ResponseEntity.ok(team);
    }

    // Assign shift to user
    @PutMapping("/{id}/assign-shift")
    public ResponseEntity<?> assignShift(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            String currentUser = getCurrentUsername();
            User user = userRepository.findById(id)
                    .orElseThrow(() ->
                        new RuntimeException(
                            "User not found!"));
            Shift shift = shiftRepository
                    .findById(request.get("shiftId"))
                    .orElseThrow(() ->
                        new RuntimeException(
                            "Shift not found!"));

            // Track old shift for audit log
            String oldShift = user.getShift() != null
                ? user.getShift().getName() : "-";
            String newShift = shift.getName();

            user.setShift(shift);
            user.setUpdatedBy(currentUser);
            userRepository.save(user);

            auditLogService.logUpdate(
                "User",
                String.valueOf(user.getId()),
                user.getUsername(),
                "shift",
                oldShift,
                newShift,
                currentUser
            );

            return ResponseEntity.ok(
                "Shift assigned successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Assign designation to user
    @PutMapping("/{id}/assign-designation")
    public ResponseEntity<?> assignDesignation(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            String currentUser = getCurrentUsername();
            User user = userRepository.findById(id)
                    .orElseThrow(() ->
                        new RuntimeException(
                            "User not found!"));
            Designation designation = designationRepository
                    .findById(request.get("designationId"))
                    .orElseThrow(() ->
                        new RuntimeException(
                            "Designation not found!"));

            // Track old designation for audit log
            String oldDesignation =
                user.getDesignation() != null
                ? user.getDesignation().getName() : "-";
            String newDesignation = designation.getName();

            user.setDesignation(designation);
            user.setUpdatedBy(currentUser);
            userRepository.save(user);

            auditLogService.logUpdate(
                "User",
                String.valueOf(user.getId()),
                user.getUsername(),
                "designation",
                oldDesignation,
                newDesignation,
                currentUser
            );

            return ResponseEntity.ok(
                "Designation assigned successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Assign department to user
    @PutMapping("/{id}/assign-department")
    public ResponseEntity<?> assignDepartment(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            String currentUser = getCurrentUsername();
            User user = userRepository.findById(id)
                    .orElseThrow(() ->
                        new RuntimeException(
                            "User not found!"));
            Department department = departmentRepository
                    .findById(request.get("departmentId"))
                    .orElseThrow(() ->
                        new RuntimeException(
                            "Department not found!"));

            // Track old department for audit log
            String oldDepartment =
                user.getDepartment() != null
                ? user.getDepartment().getName() : "-";
            String newDepartment = department.getName();

            user.setDepartment(department);
            user.setUpdatedBy(currentUser);
            userRepository.save(user);

            auditLogService.logUpdate(
                "User",
                String.valueOf(user.getId()),
                user.getUsername(),
                "department",
                oldDepartment,
                newDepartment,
                currentUser
            );

            return ResponseEntity.ok(
                "Department assigned successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Assign team leader to user
    @PutMapping("/{id}/assign-tl")
    public ResponseEntity<?> assignTeamLeader(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            String currentUser = getCurrentUsername();
            User user = userRepository.findById(id)
                    .orElseThrow(() ->
                        new RuntimeException(
                            "User not found!"));
            User tl = userRepository
                    .findById(request.get("tlId"))
                    .orElseThrow(() ->
                        new RuntimeException(
                            "TL not found!"));

            // Track old TL for audit log
            String oldTL = user.getTeamLeader() != null
                ? user.getTeamLeader().getUsername() : "-";
            String newTL = tl.getUsername();

            user.setTeamLeader(tl);
            user.setUpdatedBy(currentUser);
            userRepository.save(user);

            auditLogService.logUpdate(
                "User",
                String.valueOf(user.getId()),
                user.getUsername(),
                "teamLeader",
                oldTL,
                newTL,
                currentUser
            );

            return ResponseEntity.ok(
                "Team Leader assigned successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Soft Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id) {
        try {
            String currentUser = getCurrentUsername();
            User user = userRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException(
                        "User not found!"));

            // Save audit log before delete
            auditLogService.logDelete(
                "User",
                String.valueOf(user.getId()),
                user.getUsername(),
                currentUser
            );

            user.setStatus(-1);
            user.setDeletedAt(LocalDateTime.now());
            user.setDeletedBy(currentUser);
            userRepository.save(user);

            return ResponseEntity.ok(
                "User deleted successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }
}