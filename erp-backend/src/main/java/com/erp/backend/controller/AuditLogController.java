package com.erp.backend.controller;

import com.erp.backend.entity.AuditLog;
import com.erp.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    // Get all logs with optional status filter
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs(
            @RequestParam(required = false) Integer status) {
        List<AuditLog> logs;
        if (status != null) {
            logs = auditLogService.getLogsByStatus(status);
        } else {
            // Default: return all active logs
            logs = auditLogService.getLogsByStatus(1);
        }
        return ResponseEntity.ok(logs);
    }

    // Get logs by module
    @GetMapping("/module/{module}")
    public ResponseEntity<List<AuditLog>> getByModule(
            @PathVariable String module) {
        return ResponseEntity.ok(
            auditLogService.getLogsByModule(module));
    }

    // Get logs by action
    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getByAction(
            @PathVariable String action) {
        return ResponseEntity.ok(
            auditLogService.getLogsByAction(action));
    }

    // Get logs by user
    @GetMapping("/user/{username}")
    public ResponseEntity<List<AuditLog>> getByUser(
            @PathVariable String username) {
        return ResponseEntity.ok(
            auditLogService.getLogsByUser(username));
    }

    // Get logs by module and action
    @GetMapping("/filter")
    public ResponseEntity<List<AuditLog>> getByFilter(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action) {
        if (module != null && action != null) {
            return ResponseEntity.ok(
                auditLogService.getLogsByModuleAndAction(
                    module, action));
        } else if (module != null) {
            return ResponseEntity.ok(
                auditLogService.getLogsByModule(module));
        } else if (action != null) {
            return ResponseEntity.ok(
                auditLogService.getLogsByAction(action));
        }
        return ResponseEntity.ok(
            auditLogService.getAllLogs());
    }

    // Get logs between date range (date only, e.g. 2025-01-01)
    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLog>> getByDateRange(
            @RequestParam String from,
            @RequestParam String to) {
        LocalDateTime fromDt =
            LocalDate.parse(from).atStartOfDay();
        LocalDateTime toDt =
            LocalDate.parse(to).atTime(23, 59, 59);
        return ResponseEntity.ok(
            auditLogService.getLogsByDateRange(
                fromDt, toDt));
    }
}