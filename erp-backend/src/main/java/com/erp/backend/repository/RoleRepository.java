package com.erp.backend.repository;

import com.erp.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByName(String name);
    
    // Status-wise filters
    List<Role> findByStatus(Integer status);
}