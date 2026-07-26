package com.erp.backend.repository;

import com.erp.backend.entity.Designation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DesignationRepository
    extends JpaRepository<Designation, Long> {
    Designation findByName(String name);
    List<Designation> findByStatus(Integer status);
}