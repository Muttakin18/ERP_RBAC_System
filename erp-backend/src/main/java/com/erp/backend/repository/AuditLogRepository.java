package com.erp.backend.repository;

import com.erp.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository
    extends JpaRepository<AuditLog, Long> {

    // Get logs by module
    List<AuditLog> findByModuleOrderByPerformedAtDesc(
        String module);

    // Get logs by action
    List<AuditLog> findByActionOrderByPerformedAtDesc(
        String action);

    // Get logs by user
    List<AuditLog> findByPerformedByOrderByPerformedAtDesc(
        String performedBy);

    // Get all logs newest first
    List<AuditLog> findAllByOrderByPerformedAtDesc();

    // Get logs by module and action
    List<AuditLog> findByModuleAndActionOrderByPerformedAtDesc(
        String module, String action);

    // Get logs between dates
    List<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(
        LocalDateTime start, LocalDateTime end);

    // Get logs by status
    List<AuditLog> findByStatusOrderByPerformedAtDesc(
        Integer status);
}