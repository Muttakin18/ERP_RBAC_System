package com.erp.backend.repository;

import com.erp.backend.entity.Module;
import com.erp.backend.entity.Permission;
import com.erp.backend.entity.User;
import com.erp.backend.entity.UserModulePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserModulePermissionRepository
    extends JpaRepository<UserModulePermission, Long> {

    // Get all permissions for a specific user
    List<UserModulePermission> findByUser(User user);

    // Check if specific user has specific permission
    boolean existsByUserAndModuleAndPermission(
        User user,
        Module module,
        Permission permission
    );

    // Delete specific permission for user
    void deleteByUserAndModuleAndPermission(
        User user,
        Module module,
        Permission permission
    );

    // Get all permissions for user on specific module
    List<UserModulePermission> findByUserAndModule(
        User user,
        Module module
    );
}