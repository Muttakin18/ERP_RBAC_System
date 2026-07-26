package com.erp.backend.controller;

import com.erp.backend.entity.Shift;
import com.erp.backend.entity.User;
import com.erp.backend.repository.ShiftRepository;
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
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShiftController {

    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    // Get current logged in username
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder
            .getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    // Get ALL shifts with optional status filter
    // STATUS-FILTER-START
    @GetMapping
    public ResponseEntity<List<Shift>> getAll(
            @RequestParam(required = false) Integer status) {
        List<Shift> shifts;
        if (status != null) {
            shifts = shiftRepository.findByStatus(status);
        } else {
            // Default: show all except deleted (-1)
            shifts = shiftRepository.findAll()
                .stream()
                .filter(s -> s.getStatus() == null ||
                    s.getStatus() != -1)
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(shifts);
    }
    // STATUS-FILTER-END

    // Get shifts by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Shift>> getByStatus(
            @PathVariable Integer status) {
        return ResponseEntity.ok(
            shiftRepository.findAll()
                .stream()
                .filter(s -> s.getStatus() != null &&
                    s.getStatus().equals(status))
                .collect(Collectors.toList()));
    }

    // Get MY shift (Employee)
    @GetMapping("/my/{username}")
    public ResponseEntity<?> getMyShift(
            @PathVariable String username) {
        try {
            User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                    new RuntimeException("User not found!"));

            if (user.getShift() == null) {
                return ResponseEntity.ok(
                    "No shift assigned yet!");
            }

            return ResponseEntity.ok(user.getShift());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Get MY shift + Team shifts (TL)
    @GetMapping("/team/{username}")
    public ResponseEntity<?> getTeamShifts(
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

            if (tl.getShift() != null) {
                Map<String, Object> tlShift =
                    new HashMap<>();
                tlShift.put("username", tl.getUsername());
                tlShift.put("role", "TL (You)");
                tlShift.put("shift", tl.getShift());
                result.add(tlShift);
            }

            for (User member : team) {
                if (member.getShift() != null) {
                    Map<String, Object> memberShift =
                        new HashMap<>();
                    memberShift.put("username",
                        member.getUsername());
                    memberShift.put("role", "Employee");
                    memberShift.put("shift",
                        member.getShift());
                    result.add(memberShift);
                }
            }

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }

    // Create new shift
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Shift shift) {
        try {
            String currentUser = getCurrentUsername();
            shift.setCreatedBy(currentUser);
            shift.setUpdatedBy(currentUser);
            shift.setStatus(1);
            Shift saved = shiftRepository.save(shift);

            auditLogService.logCreate(
                "Shift",
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

    // Update shift
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Shift shift) {
        return shiftRepository.findById(id)
                .map(existing -> {
                    String currentUser = getCurrentUsername();

                    if (!existing.getName()
                            .equals(shift.getName())) {
                        auditLogService.logUpdate(
                            "Shift",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "name",
                            existing.getName(),
                            shift.getName(),
                            currentUser
                        );
                    }
                    if (existing.getStartTime() != null &&
                        !existing.getStartTime()
                            .equals(shift.getStartTime())) {
                        auditLogService.logUpdate(
                            "Shift",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "startTime",
                            existing.getStartTime().toString(),
                            shift.getStartTime() != null
                                ? shift.getStartTime().toString()
                                : "-",
                            currentUser
                        );
                    }
                    if (existing.getEndTime() != null &&
                        !existing.getEndTime()
                            .equals(shift.getEndTime())) {
                        auditLogService.logUpdate(
                            "Shift",
                            String.valueOf(existing.getId()),
                            existing.getName(),
                            "endTime",
                            existing.getEndTime().toString(),
                            shift.getEndTime() != null
                                ? shift.getEndTime().toString()
                                : "-",
                            currentUser
                        );
                    }

                    existing.setName(shift.getName());
                    existing.setStartTime(shift.getStartTime());
                    existing.setEndTime(shift.getEndTime());
                    existing.setDescription(shift.getDescription());
                    existing.setUpdatedBy(currentUser);

                    return ResponseEntity.ok(
                        shiftRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Soft Delete shift
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id) {
        try {
            String currentUser = getCurrentUsername();
            Shift shift = shiftRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Shift not found!"));

            auditLogService.logDelete(
                "Shift",
                String.valueOf(shift.getId()),
                shift.getName(),
                currentUser
            );

            shift.setStatus(-1);
            shift.setDeletedAt(LocalDateTime.now());
            shift.setDeletedBy(currentUser);
            shiftRepository.save(shift);

            return ResponseEntity.ok(
                "Shift deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(e.getMessage());
        }
    }
}