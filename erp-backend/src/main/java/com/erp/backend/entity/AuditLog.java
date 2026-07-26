package com.erp.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // CREATE, UPDATE, DELETE

    @Column(nullable = false)
    private String module; // Shift, Designation, Department, User

    @Column
    private String recordId; // ID of affected record

    @Column
    private String recordName; // Name of affected record

    @Column
    private String fieldName; // Which field changed

    @Column(columnDefinition = "TEXT")
    private String oldValue; // Value before change

    @Column(columnDefinition = "TEXT")
    private String newValue; // Value after change

    @Column(nullable = false)
    private String performedBy; // Username

    @Column(nullable = false)
    private LocalDateTime performedAt; // When

    @Column
    private String details; // Extra info

    @Column(name = "status", nullable = false)
    private Integer status = 1; // 1 = Active, 0 = Inactive, -1 = Deleted

    @PrePersist
    protected void onCreate() {
        performedAt = LocalDateTime.now();
    }
}