package com.erp.backend.controller;

import com.erp.backend.entity.Department;
import com.erp.backend.entity.User;
import com.erp.backend.repository.DepartmentRepository;
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
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    // Get current logged in username
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder
            .getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    // Get ALL departments with optional status filter
    @GetMapping
public ResponseEntity<List<Department>> getAll(
        @RequestParam(required = false) Integer status) {
    List<Department> departments;
    if (status != null) {
        departments = departmentRepository
            .findByStatus(status);
    } else {
        departments = departmentRepository.findAll()
            .stream()
            .filter(d -> d.getStatus() == null ||
                d.getStatus() != -1)
            .collect(Collectors.toList());
    }
    return ResponseEntity.ok(departments);
}
                  // Get departments by status
@GetMapping("/status/{status}")
public ResponseEntity<List<Department>> getByStatus(
        @PathVariable Integer status) {
    return ResponseEntity.ok(
        departmentRepository.findAll()
            .stream()
            .filter(d -> d.getStatus() != null &&
                d.getStatus().equals(status))
            .collect(Collectors.toList()));
}

    // Get MY department (Employee)
    @GetMapping("/my/{username}")
    public ResponseEntity<?> getMyDepartment(
            @PathVariable String username) {
        try {
            User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                    new RuntimeException("User not found!"));

            if (user.getDepartment() == null) {
                return ResponseEntity.ok(
                    "No department assigned yet!");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("department", user.getDepartment());

            if (user.getTeamLeader() != null) {
                response.put("teamLeader",
                    user.getTeamLeader().getUsername());
            }

            List<Map<String, String>> teammates =
                new ArrayList<>();

            if (user.getTeamLeader() != null) {
                userRepository.findAll()
                    .stream()
                    .filter(u ->
                        u.getTeamLeader() != null &&
                        u.getTeamLeader().getId().equals(
                            user.getTeamLeader().getId()) &&
                        !u.getId().equals(user.getId()))
                    .forEach(u -> {
                        Map<String, String> mate =
                            new HashMap<>();
                        mate.put("username",
                            u.getUsername());
                        mate.put("designation",
                            u.getDesignation() != null
                            ? u.getDesignation().getName()
                            : "Not assigned");
                        teammates.add(mate);
                    });
            }

            response.put("teammates", teammates);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Get MY team department info (TL)
    @GetMapping("/team/{username}")
    public ResponseEntity<?> getTeamDepartment(
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

            Map<String, Object> response = new HashMap<>();
            response.put("department", tl.getDepartment());
            response.put("teamLeader", tl.getUsername());

            List<Map<String, String>> teamMembers =
                new ArrayList<>();
            for (User member : team) {
                Map<String, String> memberInfo =
                    new HashMap<>();
                memberInfo.put("username",
                    member.getUsername());
                memberInfo.put("designation",
                    member.getDesignation() != null
                    ? member.getDesignation().getName()
                    : "Not assigned");
                memberInfo.put("shift",
                    member.getShift() != null
                    ? member.getShift().getName()
                    : "Not assigned");
                teamMembers.add(memberInfo);
            }

            response.put("teamMembers", teamMembers);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Create new department
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Department department) {
        try {
            String currentUser = getCurrentUsername();
            department.setCreatedBy(currentUser);
            department.setUpdatedBy(currentUser);
            department.setStatus(1);
            Department saved =
                departmentRepository.save(department);

            // Save audit log
            auditLogService.logCreate(
                "Department",
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

    // Update department
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Department department) {
        return departmentRepository.findById(id)
                .map(existing -> {
                    String currentUser = getCurrentUsername();

                    // Track name change
                    if (existing.getName() != null &&
                        !existing.getName()
                            .equals(department.getName())) {
                        auditLogService.logUpdate(
                            "Department",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "name",
                            existing.getName(),
                            department.getName(),
                            currentUser
                        );
                    }

                    // Track description change
                    if (existing.getDescription() != null &&
                        !existing.getDescription()
                            .equals(department.getDescription())) {
                        auditLogService.logUpdate(
                            "Department",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "description",
                            existing.getDescription(),
                            department.getDescription(),
                            currentUser
                        );
                    }

                    // Track manager change
                    if (existing.getManager() != null &&
                        !existing.getManager()
                            .equals(department.getManager())) {
                        auditLogService.logUpdate(
                            "Department",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "manager",
                            existing.getManager(),
                            department.getManager(),
                            currentUser
                        );
                    }

                    existing.setName(department.getName());
                    existing.setDescription(
                        department.getDescription());
                    existing.setManager(
                        department.getManager());
                    existing.setUpdatedBy(currentUser);

                    return ResponseEntity.ok(
                        departmentRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Soft Delete department
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id) {
        try {
            String currentUser = getCurrentUsername();
            Department department =
                departmentRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException(
                        "Department not found!"));

            // Save audit log before delete
            auditLogService.logDelete(
                "Department",
                String.valueOf(department.getId()),
                department.getName(),
                currentUser
            );

            department.setStatus(-1);
            department.setDeletedAt(LocalDateTime.now());
            department.setDeletedBy(currentUser);
            departmentRepository.save(department);

            return ResponseEntity.ok(
                "Department deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }
}