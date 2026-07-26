package com.erp.backend.repository;

import com.erp.backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftRepository
    extends JpaRepository<Shift, Long> {
    List<Shift> findByStatus(Integer status);
}