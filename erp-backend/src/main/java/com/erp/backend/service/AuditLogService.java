package com.erp.backend.service;

import com.erp.backend.entity.AuditLog;
import com.erp.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    // Save a log entry
    public void log(
            String action,
            String module,
            String recordId,
            String recordName,
            String fieldName,
            String oldValue,
            String newValue,
            String performedBy) {

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setModule(module);
        log.setRecordId(recordId);
        log.setRecordName(recordName);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setPerformedBy(performedBy);

        auditLogRepository.save(log);
    }

    // Shortcut for CREATE logs
    public void logCreate(
            String module,
            String recordId,
            String recordName,
            String performedBy) {
        log("CREATE", module, recordId,
            recordName, "-", "-",
            recordName, performedBy);
    }

    // Shortcut for DELETE logs
    public void logDelete(
            String module,
            String recordId,
            String recordName,
            String performedBy) {
        log("DELETE", module, recordId,
            recordName, "-",
            recordName, "-", performedBy);
    }

    // Shortcut for UPDATE logs
    public void logUpdate(
            String module,
            String recordId,
            String recordName,
            String fieldName,
            String oldValue,
            String newValue,
            String performedBy) {
        log("UPDATE", module, recordId,
            recordName, fieldName,
            oldValue, newValue, performedBy);
    }

    // Get all logs
    public List<AuditLog> getAllLogs() {
        return auditLogRepository
            .findAllByOrderByPerformedAtDesc();
    }

    // Get logs by module
    public List<AuditLog> getLogsByModule(
            String module) {
        return auditLogRepository
            .findByModuleOrderByPerformedAtDesc(module);
    }

    // Get logs by action
    public List<AuditLog> getLogsByAction(
            String action) {
        return auditLogRepository
            .findByActionOrderByPerformedAtDesc(action);
    }

    // Get logs by user
    public List<AuditLog> getLogsByUser(
            String username) {
        return auditLogRepository
            .findByPerformedByOrderByPerformedAtDesc(
                username);
    }

    // Get logs by module and action
    public List<AuditLog> getLogsByModuleAndAction(
            String module, String action) {
        return auditLogRepository
            .findByModuleAndActionOrderByPerformedAtDesc(
                module, action);
    }

    // Get logs between two dates
    public List<AuditLog> getLogsByDateRange(
            LocalDateTime from, LocalDateTime to) {
        return auditLogRepository
            .findByPerformedAtBetweenOrderByPerformedAtDesc(
                from, to);
    }
    // Get logs by status
    public List<AuditLog> getLogsByStatus(Integer status) {
        return auditLogRepository
            .findByStatusOrderByPerformedAtDesc(status);
    }}