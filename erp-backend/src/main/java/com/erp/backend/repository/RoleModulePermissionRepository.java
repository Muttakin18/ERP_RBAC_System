package com.erp.backend.repository;

import com.erp.backend.entity.RoleModulePermission;
import com.erp.backend.entity.Role;
import com.erp.backend.entity.Module;
import com.erp.backend.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleModulePermissionRepository 
    extends JpaRepository<RoleModulePermission, Long> {
    
    List<RoleModulePermission> findByRole(Role role);
    
    boolean existsByRoleAndModuleAndPermission(
        Role role, 
        Module module, 
        Permission permission
    );
}