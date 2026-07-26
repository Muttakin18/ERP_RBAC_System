package com.erp.backend.repository;

import com.erp.backend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository
    extends JpaRepository<Department, Long> {
    List<Department> findByStatus(Integer status);
}